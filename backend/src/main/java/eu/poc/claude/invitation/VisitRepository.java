package eu.poc.claude.invitation;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class VisitRepository {

    private final JdbcTemplate jdbc;

    public VisitRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final String FULL_SELECT =
        "SELECT vt.id, vt.security_check_id, vt.visitor_id, vt.invitation_id, " +
        "       vt.visit_date, vt.entrance_id, vt.status, " +
        "       vt.checked_in_at, vt.checked_in_by, " +
        "       e.entrance_name, " +
        "       v.first_name, v.last_name, v.company AS visitor_company, v.visitor_function, " +
        "       i.start_date AS inv_start, i.end_date AS inv_end, i.inviter_username " +
        "FROM poc_visit vt " +
        "JOIN poc_visitor    v  ON v.id  = vt.visitor_id " +
        "JOIN poc_entrance   e  ON e.id  = vt.entrance_id " +
        "JOIN poc_invitation i  ON i.id  = vt.invitation_id ";

    private Visit map(java.sql.ResultSet rs, int rn) throws java.sql.SQLException {
        Visit v = new Visit();
        v.setId(                 rs.getLong("id"));
        v.setSecurityCheckId(    rs.getLong("security_check_id"));
        v.setVisitorId(          rs.getLong("visitor_id"));
        v.setInvitationId(       rs.getLong("invitation_id"));
        v.setVisitDate(          rs.getDate("visit_date").toLocalDate());
        v.setEntranceId(         rs.getLong("entrance_id"));
        v.setEntranceName(       rs.getString("entrance_name"));
        v.setStatus(             rs.getString("status"));
        Timestamp ci = rs.getTimestamp("checked_in_at");
        if (ci != null) v.setCheckedInAt(ci.toLocalDateTime());
        v.setCheckedInBy(        rs.getString("checked_in_by"));
        v.setVisitorFirstName(   rs.getString("first_name"));
        v.setVisitorLastName(    rs.getString("last_name"));
        v.setVisitorCompany(     rs.getString("visitor_company"));
        v.setVisitorFunction(    rs.getString("visitor_function"));
        v.setInvitationStartDate(rs.getDate("inv_start").toLocalDate());
        v.setInvitationEndDate(  rs.getDate("inv_end").toLocalDate());
        v.setInviterUsername(    rs.getString("inviter_username"));
        return v;
    }

    // ── Create ─────────────────────────────────────────────────────────────────

    public Visit save(long securityCheckId, long visitorId, long invitationId,
                      LocalDate visitDate, long entranceId) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO poc_visit " +
                "(security_check_id, visitor_id, invitation_id, visit_date, entrance_id) " +
                "VALUES (?, ?, ?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, securityCheckId);
            ps.setLong(2, visitorId);
            ps.setLong(3, invitationId);
            ps.setDate(4, Date.valueOf(visitDate));
            ps.setLong(5, entranceId);
            return ps;
        }, keys);
        Visit v = new Visit();
        v.setId(keys.getKey().longValue());
        v.setSecurityCheckId(securityCheckId);
        v.setVisitorId(visitorId);
        v.setInvitationId(invitationId);
        v.setVisitDate(visitDate);
        v.setEntranceId(entranceId);
        v.setStatus("PENDING");
        return v;
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    public Optional<Visit> findById(long id) {
        List<Visit> rows = jdbc.query(FULL_SELECT + "WHERE vt.id = ?", this::map, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    /** Visits for a set of entrances — used by gatekeeper dashboard. */
    public List<Visit> findByEntrances(List<Long> entranceIds) {
        if (entranceIds.isEmpty()) return List.of();
        String placeholders = String.join(",", entranceIds.stream().map(x -> "?").toList());
        return jdbc.query(
            FULL_SELECT +
            "WHERE vt.entrance_id IN (" + placeholders + ") " +
            "ORDER BY vt.visit_date, v.last_name, v.first_name",
            this::map,
            entranceIds.toArray());
    }

    /** All visits checked in by a specific gatekeeper — for stats. */
    public List<Visit> findByCheckedInBy(String username) {
        return jdbc.query(
            FULL_SELECT +
            "WHERE vt.checked_in_by = ? " +
            "ORDER BY vt.checked_in_at DESC",
            this::map, username);
    }

    /** Visits for a specific security check (for drill-down). */
    public List<Visit> findBySecurityCheck(long securityCheckId) {
        return jdbc.query(
            "SELECT vt.id, vt.security_check_id, vt.visitor_id, vt.invitation_id, " +
            "       vt.visit_date, vt.entrance_id, vt.status, " +
            "       vt.checked_in_at, vt.checked_in_by, " +
            "       '' AS entrance_name, '' AS first_name, '' AS last_name, " +
            "       '' AS visitor_company, '' AS visitor_function, " +
            "       vt.visit_date AS inv_start, vt.visit_date AS inv_end, '' AS inviter_username " +
            "FROM poc_visit vt WHERE vt.security_check_id = ? ORDER BY vt.visit_date",
            (rs, rn) -> {
                Visit v = new Visit();
                v.setId(            rs.getLong("id"));
                v.setVisitDate(     rs.getDate("visit_date").toLocalDate());
                v.setStatus(        rs.getString("status"));
                return v;
            }, securityCheckId);
    }

    // ── Date index (lightweight counts per date, for lazy-loading UI) ──────────

    public record DateCount(String date, int pending, int checkedIn) {}

    public List<DateCount> findDateIndexByEntrances(List<Long> entranceIds) {
        if (entranceIds.isEmpty()) return List.of();
        String placeholders = String.join(",", entranceIds.stream().map(x -> "?").toList());
        return jdbc.query(
            "SELECT vt.visit_date, " +
            "       SUM(CASE WHEN vt.status = 'PENDING'    THEN 1 ELSE 0 END) AS pending_cnt, " +
            "       SUM(CASE WHEN vt.status = 'CHECKED_IN' THEN 1 ELSE 0 END) AS checked_in_cnt " +
            "FROM poc_visit vt " +
            "WHERE vt.entrance_id IN (" + placeholders + ") " +
            "GROUP BY vt.visit_date " +
            "ORDER BY vt.visit_date DESC",
            (rs, rn) -> new DateCount(
                rs.getDate("visit_date").toLocalDate().toString(),
                rs.getInt("pending_cnt"),
                rs.getInt("checked_in_cnt")),
            entranceIds.toArray());
    }

    public List<Visit> findByEntrancesAndDateRange(List<Long> entranceIds, LocalDate from, LocalDate to) {
        if (entranceIds.isEmpty()) return List.of();
        String placeholders = String.join(",", entranceIds.stream().map(x -> "?").toList());
        Object[] params = new Object[entranceIds.size() + 2];
        for (int i = 0; i < entranceIds.size(); i++) params[i] = entranceIds.get(i);
        params[entranceIds.size()]     = Date.valueOf(from);
        params[entranceIds.size() + 1] = Date.valueOf(to);
        return jdbc.query(
            FULL_SELECT +
            "WHERE vt.entrance_id IN (" + placeholders + ") " +
            "AND vt.visit_date BETWEEN ? AND ? " +
            "ORDER BY vt.visit_date, v.last_name, v.first_name",
            this::map, params);
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    public boolean checkIn(long id, String username) {
        int rows = jdbc.update(
            "UPDATE poc_visit SET status = 'CHECKED_IN', checked_in_at = ?, checked_in_by = ? " +
            "WHERE id = ? AND status = 'PENDING'",
            Timestamp.valueOf(LocalDateTime.now()), username, id);
        return rows > 0;
    }
}
