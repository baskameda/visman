package eu.poc.claude.sse;

import org.operaton.bpm.engine.TaskService;
import org.operaton.bpm.engine.task.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

/**
 * Watches the VisitProcess_1.0 task list for changes every 3 seconds.
 * When a change is detected (task created or completed) all connected
 * SSE clients receive a "task-update" event and re-fetch their own data.
 *
 * No BPMN changes and no ProcessEnginePlugins needed – runs in Spring's
 * scheduled thread pool.
 */
@Service
public class TaskEventService {

    private static final Logger log = LoggerFactory.getLogger(TaskEventService.class);
    private static final String PROCESS_KEY = "VisitProcess_1.0";

    private final TaskService taskService;
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private volatile String lastSnapshot = "";

    public TaskEventService(TaskService taskService) {
        this.taskService = taskService;
    }

    // ── Subscription ─────────────────────────────────────────────────────────

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(-1L);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(()    -> emitters.remove(emitter));
        emitter.onError(e       -> emitters.remove(emitter));
        log.debug("SSE client connected. Active subscribers: {}", emitters.size());
        return emitter;
    }

    // ── Scheduled change detection ────────────────────────────────────────────

    @Scheduled(fixedDelay = 3_000)
    public void detectAndBroadcast() {
        if (emitters.isEmpty()) return;
        try {
            String snapshot = buildSnapshot();
            if (!snapshot.equals(lastSnapshot)) {
                lastSnapshot = snapshot;
                broadcast();
                log.debug("Task state changed – notified {} SSE subscribers", emitters.size());
            }
        } catch (Exception e) {
            log.warn("Task change detection error: {}", e.getMessage());
        }
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private String buildSnapshot() {
        List<Task> tasks = taskService.createTaskQuery()
                .processDefinitionKey(PROCESS_KEY)
                .orderByTaskId().asc()
                .list();
        return tasks.stream()
                .map(t -> t.getId() + ":" + t.getAssignee())
                .collect(Collectors.joining(","));
    }

    private void broadcast() {
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(
                    SseEmitter.event().name("task-update").data("refresh")
                );
            } catch (Exception e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }
}
