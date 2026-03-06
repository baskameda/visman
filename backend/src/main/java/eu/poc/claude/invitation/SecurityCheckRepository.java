package eu.poc.claude.invitation;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public class SecurityCheckRepository {

    private final JdbcTemplate jdbc;

    public SecurityCheckRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final String FULL_SELECT =
        "SELECT sc.id, sc.invitation_id, sc.visitor_id, sc.status, " +
        "       sc.reliability, sc.security_note, sc.security_reviewer, sc.assigned_to, " +
        "       sc.clarification_question, sc.clarification_answer, " +
        "       sc.clarification_count, sc.decided_at, " +
        "       v.first_name, v.last_name, v.company AS visitor_company, " +
        "       v.visitor_function, v.email, v.phone, " +
        "       i.start_date, i.end_date, i.entrance_id, " +
        "       e.entrance_name, i.inviter_username, " +
        "       i.company AS invitation_company, i.description AS invitation_description " +
        "FROM poc_security_check sc " +
        "JOIN poc_visitor     v  ON v.id  = sc.visitor_id " +
        "JOIN poc_invitation  i  ON i.id  = sc.invitation_id " +
        "JOIN poc_entrance    e  ON e.id  = i.entrance_id ";

    private SecurityCheck map(java.sql.ResultSet rs, int rn) throws java.sql.SQLException {
        SecurityCheck sc = new SecurityCheck();
        sc.setId(                   rs.getLong("id"));
        sc.setInvitationId(         rs.getLong("invitation_id"));
        sc.setVisitorId(            rs.getLong("visitor_id"));
        sc.setStatus(               rs.getString("status"));
        int rel = rs.getInt("reliability"); sc.setReliability(rs.wasNull() ? null : rel);
        sc.setSecurityNote(         rs.getString("security_note"));
        sc.setSecurityReviewer(     rs.getString("security_reviewer"));
        sc.setAssignedTo(           rs.getString("assigned_to"));
        sc.setClarificationQuestion(rs.getString("clarification_question"));
        sc.setClarificationAnswer(  rs.getString("clarification_answer"));
        int cnt = rs.getInt("clarification_count"); sc.setClarificationCount(rs.wasNull() ? 0 : cnt);
        Timestamp dec = rs.getTimestamp("decided_at");
        if (dec != null) sc.setDecidedAt(dec.toLocalDateTime());

        sc.setVisitorFirstName(     rs.getString("first_name"));
        sc.setVisitorLastName(      rs.getString("last_name"));
        sc.setVisitorCompany(       rs.getString("visitor_company"));
        sc.setVisitorFunction(      rs.getString("visitor_function"));
        sc.setVisitorEmail(         rs.getString("email"));
        sc.setVisitorPhone(         rs.getString("phone"));

        sc.setStartDate(            rs.getDate("start_date").toLocalDate());
        sc.setEndDate(              rs.getDate("end_date").toLocalDate());
        sc.setEntranceId(           rs.getLong("entrance_id"));
        sc.setEntranceName(         rs.getString("entrance_name"));
        sc.setInviterUsername(      rs.getString("inviter_username"));
        sc.setInvitationCompany(    rs.getString("invitation_company"));
        sc.setInvitationDescription(rs.getString("invitation_description"));
        return sc;
    }

    // ── Create ─────────────────────────────────────────────────────────────────

    public SecurityCheck save(long invitationId, long visitorId) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO poc_security_check (invitation_id, visitor_id) VALUES (?, ?)",
                Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, invitationId);
            ps.setLong(2, visitorId);
            return ps;
        }, keys);
        SecurityCheck sc = new SecurityCheck();
        sc.setId(keys.getKey().longValue());
        sc.setInvitationId(invitationId);
        sc.setVisitorId(visitorId);
        sc.setStatus("PENDING");
        sc.setClarificationCount(0);
        return sc;
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    public Optional<SecurityCheck> findById(long id) {
        List<SecurityCheck> rows = jdbc.query(FULL_SELECT + "WHERE sc.id = ?", this::map, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public Long findIdByInvitationAndVisitor(long invitationId, long visitorId) {
        List<Long> rows = jdbc.queryForList(
            "SELECT id FROM poc_security_check WHERE invitation_id = ? AND visitor_id = ?",
            Long.class, invitationId, visitorId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public List<SecurityCheck> findByInvitation(long invitationId) {
        return jdbc.query(FULL_SELECT + "WHERE sc.invitation_id = ? ORDER BY sc.id",
                          this::map, invitationId);
    }

    public List<SecurityCheck> findByReviewer(String username) {
        return jdbc.query(FULL_SELECT + "WHERE sc.security_reviewer = ? ORDER BY sc.decided_at DESC",
                          this::map, username);
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    public void updateDecision(long id, String status, Integer reliability,
                               String note, String reviewer,
                               String clarQuestion, String clarAnswer) {
        jdbc.update(
            "UPDATE poc_security_check " +
            "SET status = ?, reliability = ?, security_note = ?, security_reviewer = ?, " +
            "    clarification_question = ?, decided_at = ? " +
            "WHERE id = ?",
            status, reliability, note, reviewer, clarQuestion,
            Timestamp.valueOf(LocalDateTime.now()), id);
        // store clarification answer only when provided
        if (clarAnswer != null) {
            jdbc.update(
                "UPDATE poc_security_check SET clarification_answer = ? WHERE id = ?",
                clarAnswer, id);
        }
    }

    public void incrementClarificationCount(long id) {
        jdbc.update(
            "UPDATE poc_security_check " +
            "SET clarification_count = COALESCE(clarification_count, 0) + 1 " +
            "WHERE id = ?", id);
    }

    public void updateClarificationAnswer(long id, String answer) {
        jdbc.update(
            "UPDATE poc_security_check SET clarification_answer = ? WHERE id = ?",
            answer, id);
    }

    public void updateStatus(long id, String status) {
        jdbc.update("UPDATE poc_security_check SET status = ?, decided_at = ? WHERE id = ?",
                    status, Timestamp.valueOf(LocalDateTime.now()), id);
    }

    public void setAssignedTo(long id, String username) {
        jdbc.update("UPDATE poc_security_check SET assigned_to = ? WHERE id = ?", username, id);
    }

    /**
     * Supervisor claim: set security_reviewer preemptively to signal ownership.
     * Returns false if already claimed by someone else (optimistic guard).
     */
    public boolean claimCheck(long id, String supervisorUsername) {
        int rows = jdbc.update(
            "UPDATE poc_security_check SET security_reviewer = ? " +
            "WHERE id = ? AND status = 'PENDING' " +
            "AND (security_reviewer IS NULL OR security_reviewer = ?)",
            supervisorUsername, id, supervisorUsername);
        return rows > 0;
    }

    // ── Filtered pending queries (for dashboard tabs) ──────────────────────────

    /** My assigned checks (assigned_to = me) + unassigned (assigned_to IS NULL). */
    public List<SecurityCheck> findPendingForOfficer(String username) {
        return jdbc.query(
            FULL_SELECT +
            "WHERE sc.status = 'PENDING' " +
            "AND (sc.assigned_to = ? OR sc.assigned_to IS NULL) " +
            "ORDER BY sc.id",
            this::map, username);
    }

    /** Checks assigned to other officers (not me, not unassigned). */
    public List<SecurityCheck> findPendingOfOthers(String username) {
        return jdbc.query(
            FULL_SELECT +
            "WHERE sc.status = 'PENDING' " +
            "AND sc.assigned_to IS NOT NULL AND sc.assigned_to <> ? " +
            "ORDER BY sc.assigned_to, sc.id",
            this::map, username);
    }

    /** Pending checks assigned to any of the given supervisees. */
    public List<SecurityCheck> findPendingBySupervisees(List<String> usernames) {
        if (usernames.isEmpty()) return List.of();
        String placeholders = String.join(",", Collections.nCopies(usernames.size(), "?"));
        return jdbc.query(
            FULL_SELECT +
            "WHERE sc.status = 'PENDING' " +
            "AND sc.assigned_to IN (" + placeholders + ") " +
            "ORDER BY sc.assigned_to, sc.id",
            this::map, usernames.toArray());
    }

    /** Count of pending checks per officer — used for least-loaded assignment. */
    public int countPendingForOfficer(String username) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM poc_security_check WHERE assigned_to = ? AND status = 'PENDING'",
            Integer.class, username);
        return count != null ? count : 0;
    }
}
