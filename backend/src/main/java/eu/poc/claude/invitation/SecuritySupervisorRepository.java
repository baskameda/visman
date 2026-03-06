package eu.poc.claude.invitation;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SecuritySupervisorRepository {

    private final JdbcTemplate jdbc;

    public SecuritySupervisorRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public boolean isSupervisor(String username) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM poc_security_supervisor_assignment WHERE supervisor_username = ?",
            Integer.class, username);
        return count != null && count > 0;
    }

    public List<String> findSupervisees(String supervisorUsername) {
        return jdbc.queryForList(
            "SELECT officer_username FROM poc_security_supervisor_assignment WHERE supervisor_username = ?",
            String.class, supervisorUsername);
    }

    public String findSupervisorOf(String officerUsername) {
        List<String> rows = jdbc.queryForList(
            "SELECT supervisor_username FROM poc_security_supervisor_assignment WHERE officer_username = ?",
            String.class, officerUsername);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public int countSupervisees(String supervisorUsername) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM poc_security_supervisor_assignment WHERE supervisor_username = ?",
            Integer.class, supervisorUsername);
        return count != null ? count : 0;
    }

    public List<Assignment> findAll() {
        return jdbc.query(
            "SELECT officer_username, supervisor_username FROM poc_security_supervisor_assignment " +
            "ORDER BY supervisor_username, officer_username",
            (rs, rn) -> new Assignment(rs.getString("officer_username"), rs.getString("supervisor_username")));
    }

    public void assign(String officerUsername, String supervisorUsername) {
        int updated = jdbc.update(
            "UPDATE poc_security_supervisor_assignment SET supervisor_username = ? WHERE officer_username = ?",
            supervisorUsername, officerUsername);
        if (updated == 0) {
            jdbc.update(
                "INSERT INTO poc_security_supervisor_assignment (officer_username, supervisor_username) VALUES (?, ?)",
                officerUsername, supervisorUsername);
        }
    }

    public void remove(String officerUsername) {
        jdbc.update(
            "DELETE FROM poc_security_supervisor_assignment WHERE officer_username = ?",
            officerUsername);
    }

    public record Assignment(String officerUsername, String supervisorUsername) {}
}
