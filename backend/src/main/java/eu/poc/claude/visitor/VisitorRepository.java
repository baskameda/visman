package eu.poc.claude.visitor;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class VisitorRepository {

    private final JdbcTemplate jdbc;

    public VisitorRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final String SELECT_COLS =
        "id, first_name, last_name, company, visitor_function, email, phone, description, created_by, blacklisted";

    private static final RowMapper<Visitor> ROW_MAPPER = (rs, rowNum) -> {
        Visitor v = new Visitor();
        v.setId(          rs.getLong("id"));
        v.setFirstName(   rs.getString("first_name"));
        v.setLastName(    rs.getString("last_name"));
        v.setCompany(     rs.getString("company"));
        v.setFunction(    rs.getString("visitor_function"));
        v.setEmail(       rs.getString("email"));
        v.setPhone(       rs.getString("phone"));
        v.setDescription( rs.getString("description"));
        v.setCreatedBy(   rs.getString("created_by"));
        v.setBlacklisted( rs.getBoolean("blacklisted"));
        return v;
    };

    // ── Write ─────────────────────────────────────────────────────────────────

    public Visitor save(Visitor visitor, String createdBy) {
        final String sql =
            "INSERT INTO poc_visitor " +
            "(first_name, last_name, company, visitor_function, email, phone, description, created_by, blacklisted) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)";

        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, visitor.getFirstName());
            ps.setString(2, visitor.getLastName());
            ps.setString(3, visitor.getCompany());
            ps.setString(4, visitor.getFunction());
            ps.setString(5, visitor.getEmail());
            ps.setString(6, visitor.getPhone());
            ps.setString(7, visitor.getDescription());
            ps.setString(8, createdBy);
            return ps;
        }, keys);

        visitor.setId(keys.getKey().longValue());
        visitor.setCreatedBy(createdBy);
        visitor.setBlacklisted(false);
        return visitor;
    }

    /** Toggle blacklist flag for a visitor by ID. */
    public void updateBlacklist(long id, boolean blacklisted) {
        jdbc.update("UPDATE poc_visitor SET blacklisted = ? WHERE id = ?",
                    blacklisted ? 1 : 0, id);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public Optional<Visitor> findById(long id) {
        List<Visitor> rows = jdbc.query(
            "SELECT " + SELECT_COLS + " FROM poc_visitor WHERE id = ?",
            ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    /**
     * Search visitors owned by {@code createdBy}.
     * Returns blacklisted visitors too — the UI marks them and prevents selection.
     */
    public List<Visitor> search(String query, String createdBy) {
        if (query == null || query.isBlank()) {
            return jdbc.query(
                "SELECT TOP 20 " + SELECT_COLS + " FROM poc_visitor " +
                "WHERE created_by = ? " +
                "ORDER BY blacklisted DESC, last_name, first_name",
                ROW_MAPPER, createdBy);
        }
        String like = "%" + query.toLowerCase() + "%";
        return jdbc.query(
            "SELECT TOP 20 " + SELECT_COLS + " FROM poc_visitor " +
            "WHERE created_by = ? " +
            "  AND (LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? " +
            "    OR LOWER(company) LIKE ? OR LOWER(email) LIKE ?) " +
            "ORDER BY blacklisted DESC, last_name, first_name",
            ROW_MAPPER, createdBy, like, like, like, like);
    }

    /** Returns all blacklisted visitors across all owners — for Security view. */
    public List<Visitor> findAllBlacklisted() {
        return jdbc.query(
            "SELECT " + SELECT_COLS + " FROM poc_visitor " +
            "WHERE blacklisted = 1 ORDER BY last_name, first_name",
            ROW_MAPPER);
    }
}
