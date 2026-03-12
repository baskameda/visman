package eu.poc.claude.location;

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
public class LocationRepository {

    private final JdbcTemplate jdbc;

    public LocationRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final RowMapper<Location> ROW_MAPPER = (rs, rowNum) -> {
        Location l = new Location();
        l.setId(           rs.getLong("id"));
        l.setName(         rs.getString("name"));
        l.setDescription(  rs.getString("description"));
        Double lat = rs.getDouble("latitude");
        l.setLatitude(rs.wasNull() ? null : lat);
        Double lng = rs.getDouble("longitude");
        l.setLongitude(rs.wasNull() ? null : lng);
        return l;
    };

    // ── Read ───────────────────────────────────────────────────────────────────

    public List<Location> findAll() {
        return jdbc.query(
            "SELECT l.id, l.name, l.description, l.latitude, l.longitude, " +
            "       COUNT(e.id) AS entrance_count " +
            "FROM poc_location l " +
            "LEFT JOIN poc_entrance e ON e.location_id = l.id " +
            "GROUP BY l.id, l.name, l.description, l.latitude, l.longitude " +
            "ORDER BY l.name",
            (rs, rowNum) -> {
                Location loc = ROW_MAPPER.mapRow(rs, rowNum);
                loc.setEntranceCount(rs.getInt("entrance_count"));
                return loc;
            });
    }

    public Optional<Location> findById(long id) {
        List<Location> rows = jdbc.query(
            "SELECT id, name, description, latitude, longitude FROM poc_location WHERE id = ?",
            ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public int countEntrances(long locationId) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM poc_entrance WHERE location_id = ?", Integer.class, locationId);
        return count != null ? count : 0;
    }

    // ── Write ──────────────────────────────────────────────────────────────────

    public Location save(Location location) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO poc_location (name, description, latitude, longitude) VALUES (?, ?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, location.getName());
            ps.setString(2, location.getDescription());
            if (location.getLatitude() != null) ps.setDouble(3, location.getLatitude());
            else ps.setNull(3, java.sql.Types.DECIMAL);
            if (location.getLongitude() != null) ps.setDouble(4, location.getLongitude());
            else ps.setNull(4, java.sql.Types.DECIMAL);
            return ps;
        }, keys);
        location.setId(keys.getKey().longValue());
        return location;
    }

    public boolean update(long id, Location location) {
        int rows = jdbc.update(
            "UPDATE poc_location SET name = ?, description = ?, latitude = ?, longitude = ? WHERE id = ?",
            location.getName(), location.getDescription(),
            location.getLatitude(), location.getLongitude(), id);
        return rows > 0;
    }

    public boolean delete(long id) {
        return jdbc.update("DELETE FROM poc_location WHERE id = ?", id) > 0;
    }

    // ── Users by location ──────────────────────────────────────────────────────

    public record LocationUser(String id, String firstName, String lastName) {}

    /** Returns all users assigned to a location via poc_user_location_assignment. */
    public List<LocationUser> findUsersByLocation(long locationId) {
        return jdbc.query(
            "SELECT u.ID_ AS id, u.FIRST_ AS firstName, u.LAST_ AS lastName " +
            "FROM poc_user_location_assignment ula " +
            "JOIN ACT_ID_USER u ON u.ID_ = ula.username " +
            "WHERE ula.location_id = ? " +
            "ORDER BY u.FIRST_, u.LAST_",
            (rs, rn) -> new LocationUser(
                rs.getString("id"),
                rs.getString("firstName"),
                rs.getString("lastName")),
            locationId);
    }
}
