package eu.poc.claude.entrance;

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
public class EntranceRepository {

    private final JdbcTemplate jdbc;

    public EntranceRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final RowMapper<Entrance> ROW_MAPPER = (rs, rowNum) -> {
        Entrance e = new Entrance();
        e.setId(          rs.getLong("id"));
        e.setName(        rs.getString("entrance_name"));
        e.setDescription( rs.getString("description"));
        e.setLocationId(  rs.getLong("location_id"));
        return e;
    };

    // ── Entrance CRUD ──────────────────────────────────────────────────────────

    public List<Entrance> findAll() {
        return jdbc.query(
            "SELECT id, entrance_name, description, location_id FROM poc_entrance ORDER BY entrance_name",
            ROW_MAPPER);
    }

    public List<Entrance> findByLocation(long locationId) {
        return jdbc.query(
            "SELECT id, entrance_name, description, location_id FROM poc_entrance " +
            "WHERE location_id = ? ORDER BY entrance_name",
            ROW_MAPPER, locationId);
    }

    public Optional<Entrance> findById(long id) {
        List<Entrance> rows = jdbc.query(
            "SELECT id, entrance_name, description, location_id FROM poc_entrance WHERE id = ?",
            ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public Entrance save(Entrance entrance) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO poc_entrance (entrance_name, description, location_id) VALUES (?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, entrance.getName());
            ps.setString(2, entrance.getDescription());
            ps.setLong(3, entrance.getLocationId());
            return ps;
        }, keys);
        entrance.setId(keys.getKey().longValue());
        return entrance;
    }

    public boolean update(long id, Entrance entrance) {
        int rows = jdbc.update(
            "UPDATE poc_entrance SET entrance_name = ?, description = ? WHERE id = ?",
            entrance.getName(), entrance.getDescription(), id);
        return rows > 0;
    }

    public boolean delete(long id) {
        return jdbc.update("DELETE FROM poc_entrance WHERE id = ?", id) > 0;
    }

    // ── Gatekeeper assignments ─────────────────────────────────────────────────

    /** Returns all gatekeeper usernames assigned to a given entrance. */
    public List<String> findGatekeepers(long entranceId) {
        return jdbc.queryForList(
            "SELECT gatekeeper_username FROM poc_entrance_gatekeeper WHERE entrance_id = ? ORDER BY gatekeeper_username",
            String.class, entranceId);
    }

    /** Replaces the full gatekeeper assignment for an entrance (delete-then-insert). */
    public void setGatekeepers(long entranceId, List<String> usernames) {
        jdbc.update("DELETE FROM poc_entrance_gatekeeper WHERE entrance_id = ?", entranceId);
        for (String u : usernames) {
            jdbc.update(
                "INSERT INTO poc_entrance_gatekeeper (entrance_id, gatekeeper_username) VALUES (?, ?)",
                entranceId, u);
        }
    }

    /** Returns all entrances assigned to a given gatekeeper. */
    public List<Entrance> findByGatekeeper(String username) {
        return jdbc.query(
            "SELECT e.id, e.entrance_name, e.description, e.location_id " +
            "FROM poc_entrance e " +
            "JOIN poc_entrance_gatekeeper eg ON eg.entrance_id = e.id " +
            "WHERE eg.gatekeeper_username = ? " +
            "ORDER BY e.entrance_name",
            ROW_MAPPER, username);
    }

    /**
     * Returns gatekeeper usernames already assigned to entrances in a DIFFERENT location.
     * Used to prevent a gatekeeper from working at more than one location.
     */
    public List<String> findGatekeepersInOtherLocations(long locationId) {
        return jdbc.queryForList(
            "SELECT DISTINCT eg.gatekeeper_username " +
            "FROM poc_entrance_gatekeeper eg " +
            "JOIN poc_entrance e ON e.id = eg.entrance_id " +
            "WHERE e.location_id <> ?",
            String.class, locationId);
    }
}
