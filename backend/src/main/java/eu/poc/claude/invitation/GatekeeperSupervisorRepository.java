package eu.poc.claude.invitation;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class GatekeeperSupervisorRepository {

    private final JdbcTemplate jdbc;

    public GatekeeperSupervisorRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public boolean isSupervisor(String username) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM poc_gatekeeper_supervisor_assignment WHERE supervisor_username = ?",
            Integer.class, username);
        return count != null && count > 0;
    }

    public List<String> findSupervisees(String supervisorUsername) {
        return jdbc.queryForList(
            "SELECT porter_username FROM poc_gatekeeper_supervisor_assignment WHERE supervisor_username = ?",
            String.class, supervisorUsername);
    }

    public String findSupervisorOf(String porterUsername) {
        List<String> rows = jdbc.queryForList(
            "SELECT supervisor_username FROM poc_gatekeeper_supervisor_assignment WHERE porter_username = ?",
            String.class, porterUsername);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public int countSupervisees(String supervisorUsername) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM poc_gatekeeper_supervisor_assignment WHERE supervisor_username = ?",
            Integer.class, supervisorUsername);
        return count != null ? count : 0;
    }

    public List<Assignment> findAll() {
        return jdbc.query(
            "SELECT porter_username, supervisor_username FROM poc_gatekeeper_supervisor_assignment " +
            "ORDER BY supervisor_username, porter_username",
            (rs, rn) -> new Assignment(rs.getString("porter_username"), rs.getString("supervisor_username")));
    }

    public void assign(String porterUsername, String supervisorUsername) {
        int updated = jdbc.update(
            "UPDATE poc_gatekeeper_supervisor_assignment SET supervisor_username = ? WHERE porter_username = ?",
            supervisorUsername, porterUsername);
        if (updated == 0) {
            jdbc.update(
                "INSERT INTO poc_gatekeeper_supervisor_assignment (porter_username, supervisor_username) VALUES (?, ?)",
                porterUsername, supervisorUsername);
        }
    }

    public void remove(String porterUsername) {
        jdbc.update(
            "DELETE FROM poc_gatekeeper_supervisor_assignment WHERE porter_username = ?",
            porterUsername);
    }

    public record Assignment(String porterUsername, String supervisorUsername) {}
}
