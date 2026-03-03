package eu.poc.claude.sse;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Provides a Server-Sent Events stream that the React frontend subscribes to.
 * When the backend detects a task-list change it pushes a "task-update" event;
 * the frontend re-fetches whatever data is relevant for the current user.
 *
 * The endpoint carries no sensitive data – it just signals "something changed".
 * Actual task data is fetched via the authenticated /engine-rest API as before.
 */
@RestController
@RequestMapping("/api/sse")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000" })
public class SseController {

    private final TaskEventService taskEventService;

    public SseController(TaskEventService taskEventService) {
        this.taskEventService = taskEventService;
    }

    @GetMapping(value = "/tasks", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToTaskUpdates() {
        return taskEventService.subscribe();
    }
}
