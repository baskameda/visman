package eu.poc.claude.invitation;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public class InvitationRepository {

    private final JdbcTemplate jdbc;

    public InvitationRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    // ── Create ─────────────────────────────────────────────────────────────────

    public Invitation save(Invitation inv) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO poc_invitation " +
                "(inviter_username, start_date, end_date, entrance_id, company, description) " +
                "VALUES (?, ?, ?, ?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, inv.getInviterUsername());
            ps.setDate(  2, Date.valueOf(inv.getStartDate()));
            ps.setDate(  3, Date.valueOf(inv.getEndDate()));
            ps.setLong(  4, inv.getEntranceId());
            ps.setString(5, inv.getCompany());
            ps.setString(6, inv.getDescription());
            return ps;
        }, keys);
        inv.setId(keys.getKey().longValue());
        return inv;
    }

    public void addVisitor(long invitationId, long visitorId) {
        jdbc.update(
            "INSERT INTO poc_invitation_visitor (invitation_id, visitor_id) VALUES (?, ?)",
            invitationId, visitorId);
    }

    public void setProcessInstanceId(long invitationId, String processInstanceId) {
        jdbc.update(
            "UPDATE poc_invitation SET process_instance_id = ? WHERE id = ?",
            processInstanceId, invitationId);
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    // ── Month summary ──────────────────────────────────────────────────────────

    public record MonthSummary(int year, int month, int count) {}

    /** Returns distinct year/month pairs for which the inviter has invitations, newest first. */
    public List<MonthSummary> findMonthsByInviter(String username) {
        return jdbc.query(
            "SELECT YEAR(i.start_date) AS yr, MONTH(i.start_date) AS mo, COUNT(*) AS cnt " +
            "FROM poc_invitation i " +
            "WHERE i.inviter_username = ? " +
            "GROUP BY YEAR(i.start_date), MONTH(i.start_date) " +
            "ORDER BY yr DESC, mo DESC",
            (rs, rn) -> new MonthSummary(rs.getInt("yr"), rs.getInt("mo"), rs.getInt("cnt")),
            username);
    }

    private static final String INV_SELECT =
            "SELECT i.id, i.inviter_username, i.start_date, i.end_date, " +
            "       i.company, i.description, i.process_instance_id, i.created_at, " +
            "       e.entrance_name, i.entrance_id, " +
            "       CASE " +
            "         WHEN COUNT(sc.id) = 0 THEN 'PENDING' " +
            "         WHEN SUM(CASE WHEN sc.status = 'PENDING'    THEN 1 ELSE 0 END) = COUNT(sc.id) THEN 'PENDING' " +
            "         WHEN SUM(CASE WHEN sc.status = 'APPROVED'   THEN 1 ELSE 0 END) = COUNT(sc.id) THEN 'APPROVED' " +
            "         WHEN SUM(CASE WHEN sc.status IN ('REFUSED','BLACKLISTED') THEN 1 ELSE 0 END) = COUNT(sc.id) THEN 'REFUSED' " +
            "         ELSE 'IN_REVIEW' " +
            "       END AS status " +
            "FROM poc_invitation i " +
            "JOIN poc_entrance e ON e.id = i.entrance_id " +
            "LEFT JOIN poc_security_check sc ON sc.invitation_id = i.id ";

    private static final String INV_GROUP =
            "GROUP BY i.id, i.inviter_username, i.start_date, i.end_date, " +
            "         i.company, i.description, i.process_instance_id, i.created_at, " +
            "         e.entrance_name, i.entrance_id " +
            "ORDER BY i.created_at DESC";

    private static final org.springframework.jdbc.core.RowMapper<Invitation> INV_ROW = (rs, rn) -> {
        Invitation inv = new Invitation();
        inv.setId(               rs.getLong("id"));
        inv.setInviterUsername(  rs.getString("inviter_username"));
        inv.setStartDate(        rs.getDate("start_date").toLocalDate());
        inv.setEndDate(          rs.getDate("end_date").toLocalDate());
        inv.setEntranceId(       rs.getLong("entrance_id"));
        inv.setEntranceName(     rs.getString("entrance_name"));
        inv.setCompany(          rs.getString("company"));
        inv.setDescription(      rs.getString("description"));
        inv.setProcessInstanceId(rs.getString("process_instance_id"));
        inv.setStatus(           rs.getString("status"));
        return inv;
    };

    /** Summary list for the inviter's own dashboard — status computed from security checks. */
    public List<Invitation> findByInviter(String username) {
        return jdbc.query(INV_SELECT + "WHERE i.inviter_username = ? " + INV_GROUP, INV_ROW, username);
    }

    /** Invitations for a specific year/month (used for lazy loading). */
    public List<Invitation> findByInviterAndMonth(String username, int year, int month) {
        return jdbc.query(
            INV_SELECT +
            "WHERE i.inviter_username = ? AND YEAR(i.start_date) = ? AND MONTH(i.start_date) = ? " +
            INV_GROUP,
            INV_ROW, username, year, month);
    }

    /** Full detail with visitor list (no visits — those are loaded separately). */
    public Optional<Invitation> findById(long id) {
        List<Invitation> rows = jdbc.query(
            "SELECT i.id, i.inviter_username, i.start_date, i.end_date, " +
            "       i.company, i.description, i.process_instance_id, i.created_at, " +
            "       e.entrance_name, i.entrance_id " +
            "FROM poc_invitation i " +
            "JOIN poc_entrance e ON e.id = i.entrance_id " +
            "WHERE i.id = ?",
            (rs, rn) -> {
                Invitation inv = new Invitation();
                inv.setId(               rs.getLong("id"));
                inv.setInviterUsername(  rs.getString("inviter_username"));
                inv.setStartDate(        rs.getDate("start_date").toLocalDate());
                inv.setEndDate(          rs.getDate("end_date").toLocalDate());
                inv.setEntranceId(       rs.getLong("entrance_id"));
                inv.setEntranceName(     rs.getString("entrance_name"));
                inv.setCompany(          rs.getString("company"));
                inv.setDescription(      rs.getString("description"));
                inv.setProcessInstanceId(rs.getString("process_instance_id"));
                return inv;
            }, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    /** Visitor IDs linked to an invitation. */
    public List<Long> findVisitorIds(long invitationId) {
        return jdbc.queryForList(
            "SELECT visitor_id FROM poc_invitation_visitor WHERE invitation_id = ? ORDER BY visitor_id",
            Long.class, invitationId);
    }

    /** Check if a visitor is already linked to this invitation. */
    public boolean visitorAlreadyLinked(long invitationId, long visitorId) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM poc_invitation_visitor WHERE invitation_id = ? AND visitor_id = ?",
            Integer.class, invitationId, visitorId);
        return count != null && count > 0;
    }

    /** Summary list for multiple inviters — used by supervisor dashboard. */
    public List<Invitation> findByInviters(List<String> usernames) {
        if (usernames.isEmpty()) return List.of();
        String placeholders = String.join(",", java.util.Collections.nCopies(usernames.size(), "?"));
        return jdbc.query(
            "SELECT i.id, i.inviter_username, i.start_date, i.end_date, " +
            "       i.company, i.description, i.process_instance_id, i.created_at, " +
            "       e.entrance_name, i.entrance_id, " +
            "       CASE " +
            "         WHEN COUNT(sc.id) = 0 THEN 'PENDING' " +
            "         WHEN SUM(CASE WHEN sc.status = 'PENDING'    THEN 1 ELSE 0 END) = COUNT(sc.id) THEN 'PENDING' " +
            "         WHEN SUM(CASE WHEN sc.status = 'APPROVED'   THEN 1 ELSE 0 END) = COUNT(sc.id) THEN 'APPROVED' " +
            "         WHEN SUM(CASE WHEN sc.status IN ('REFUSED','BLACKLISTED') THEN 1 ELSE 0 END) = COUNT(sc.id) THEN 'REFUSED' " +
            "         ELSE 'IN_REVIEW' " +
            "       END AS status " +
            "FROM poc_invitation i " +
            "JOIN poc_entrance e ON e.id = i.entrance_id " +
            "LEFT JOIN poc_security_check sc ON sc.invitation_id = i.id " +
            "WHERE i.inviter_username IN (" + placeholders + ") " +
            "GROUP BY i.id, i.inviter_username, i.start_date, i.end_date, " +
            "         i.company, i.description, i.process_instance_id, i.created_at, " +
            "         e.entrance_name, i.entrance_id " +
            "ORDER BY i.created_at DESC",
            (rs, rn) -> {
                Invitation inv = new Invitation();
                inv.setId(              rs.getLong("id"));
                inv.setInviterUsername( rs.getString("inviter_username"));
                inv.setStartDate(       rs.getDate("start_date").toLocalDate());
                inv.setEndDate(         rs.getDate("end_date").toLocalDate());
                inv.setEntranceId(      rs.getLong("entrance_id"));
                inv.setEntranceName(    rs.getString("entrance_name"));
                inv.setCompany(         rs.getString("company"));
                inv.setDescription(     rs.getString("description"));
                inv.setProcessInstanceId(rs.getString("process_instance_id"));
                inv.setStatus(          rs.getString("status"));
                return inv;
            }, usernames.toArray());
    }

    public void updateInviterUsername(long invitationId, String newInviterUsername) {
        jdbc.update(
            "UPDATE poc_invitation SET inviter_username = ? WHERE id = ?",
            newInviterUsername, invitationId);
    }

    /** Date range of an invitation (for visit-creation delegate). */
    public LocalDate[] findDateRange(long invitationId) {
        return jdbc.queryForObject(
            "SELECT start_date, end_date FROM poc_invitation WHERE id = ?",
            (rs, rn) -> new LocalDate[]{
                rs.getDate("start_date").toLocalDate(),
                rs.getDate("end_date").toLocalDate()
            }, invitationId);
    }
}
