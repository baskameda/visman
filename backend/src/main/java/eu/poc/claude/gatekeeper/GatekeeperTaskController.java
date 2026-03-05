package eu.poc.claude.gatekeeper;

import eu.poc.claude.entrance.Entrance;
import eu.poc.claude.entrance.EntranceRepository;
import org.operaton.bpm.engine.RuntimeService;
import org.operaton.bpm.engine.TaskService;
import org.operaton.bpm.engine.task.Task;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Provides a filtered view of "Allow Visit" tasks for the authenticated gatekeeper.
 *
 * Filtering rule:
 *   - Tasks with no VEntranceId → visible to every gatekeeper.
 *   - Tasks with a VEntranceId → visible only if that entrance is assigned
 *     to this gatekeeper in poc_entrance_gatekeeper.
 */
@RestController
@RequestMapping("/api/tasks")
public class GatekeeperTaskController {

    private final TaskService        taskService;
    private final RuntimeService     runtimeService;
    private final EntranceRepository entranceRepo;

    public GatekeeperTaskController(TaskService taskService,
                                    RuntimeService runtimeService,
                                    EntranceRepository entranceRepo) {
        this.taskService    = taskService;
        this.runtimeService = runtimeService;
        this.entranceRepo   = entranceRepo;
    }

    // ── GET /api/tasks/gatekeeper ─────────────────────────────────────────────

    @GetMapping("/gatekeeper")
    public List<TaskDto> getGatekeeperTasks(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = requireUsername(authHeader);

        Set<Long> myEntranceIds = entranceRepo.findByGatekeeper(username)
                .stream()
                .map(Entrance::getId)
                .collect(Collectors.toSet());

        // Mirror the REST API: candidateGroup query excludes claimed (assigned) tasks
        List<Task> porterTasks = taskService.createTaskQuery()
                .taskCandidateGroup("Porters")
                .list();

        // Gatekeeper with no entrances assigned sees nothing
        if (myEntranceIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<TaskDto> result = new ArrayList<>();
        for (Task task : porterTasks) {
            Object raw = runtimeService.getVariable(task.getProcessInstanceId(), "VEntranceId");
            Long entranceId = toLong(raw);
            // Strict match: invitation must have an entrance that belongs to this gatekeeper
            if (entranceId != null && myEntranceIds.contains(entranceId)) {
                result.add(TaskDto.from(task));
            }
        }
        return result;
    }

    // ── DTO ───────────────────────────────────────────────────────────────────

    /** Subset of the Operaton task fields the frontend actually uses. */
    public record TaskDto(
            String id,
            String name,
            String assignee,
            String processInstanceId,
            String taskDefinitionKey,
            String created
    ) {
        static TaskDto from(Task t) {
            return new TaskDto(
                    t.getId(),
                    t.getName(),
                    t.getAssignee(),
                    t.getProcessInstanceId(),
                    t.getTaskDefinitionKey(),
                    t.getCreateTime() != null ? t.getCreateTime().toInstant().toString() : null
            );
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Long toLong(Object v) {
        if (v == null)             return null;
        if (v instanceof Long l)   return l;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); }
        catch (NumberFormatException e) { return null; }
    }

    private String requireUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Basic "))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        try {
            String decoded = new String(Base64.getDecoder().decode(authHeader.substring(6)));
            String[] parts = decoded.split(":", 2);
            if (parts.length >= 1 && !parts[0].isBlank()) return parts[0];
        } catch (IllegalArgumentException ignored) {}
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
}
