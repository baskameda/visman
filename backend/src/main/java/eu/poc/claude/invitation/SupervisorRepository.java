package eu.poc.claude.invitation;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SupervisorRepository {

    private final JdbcTemplate jdbc;

    public SupervisorRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    // ── Queries ────────────────────────────────────────────────────────────────

    public boolean isSupervisor(String username) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM poc_supervisor_assignment WHERE supervisor_username = ?",
            Integer.class, username);
        return count != null && count > 0;
    }

    /** Returns all inviter usernames supervised by the given supervisor. */
    public List<String> findSupervisees(String supervisorUsername) {
        return jdbc.queryForList(
            "SELECT inviter_username FROM poc_supervisor_assignment WHERE supervisor_username = ?",
            String.class, supervisorUsername);
    }

    public int countSupervisees(String supervisorUsername) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM poc_supervisor_assignment WHERE supervisor_username = ?",
            Integer.class, supervisorUsername);
        return count != null ? count : 0;
    }

    /** Returns the supervisor for a given inviter, or null if none assigned. */
    public String findSupervisorOf(String inviterUsername) {
        List<String> rows = jdbc.queryForList(
            "SELECT supervisor_username FROM poc_supervisor_assignment WHERE inviter_username = ?",
            String.class, inviterUsername);
        return rows.isEmpty() ? null : rows.get(0);
    }

    /** Returns all assignments as (inviterUsername, supervisorUsername) pairs. */
    public List<Assignment> findAll() {
        return jdbc.query(
            "SELECT inviter_username, supervisor_username FROM poc_supervisor_assignment ORDER BY supervisor_username, inviter_username",
            (rs, rn) -> new Assignment(rs.getString("inviter_username"), rs.getString("supervisor_username")));
    }

    // ── Mutations ──────────────────────────────────────────────────────────────

    /**
     * Assigns or re-assigns a supervisor for an inviter.
     * Uses MERGE (SQL Server) to upsert.
     */
    public void assign(String inviterUsername, String supervisorUsername) {
        int updated = jdbc.update(
            "UPDATE poc_supervisor_assignment SET supervisor_username = ? WHERE inviter_username = ?",
            supervisorUsername, inviterUsername);
        if (updated == 0) {
            jdbc.update(
                "INSERT INTO poc_supervisor_assignment (inviter_username, supervisor_username) VALUES (?, ?)",
                inviterUsername, supervisorUsername);
        }
    }

    public void remove(String inviterUsername) {
        jdbc.update(
            "DELETE FROM poc_supervisor_assignment WHERE inviter_username = ?",
            inviterUsername);
    }

    // ── DTO ───────────────────────────────────────────────────────────────────

    public record Assignment(String inviterUsername, String supervisorUsername) {}
}
