package eu.poc.claude.invitation;

import org.operaton.bpm.engine.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security-checks")
public class SecurityCheckController {

    private final SecurityCheckRepository repo;
    private final TaskService             taskService;

    public SecurityCheckController(SecurityCheckRepository repo, TaskService taskService) {
        this.repo        = repo;
        this.taskService = taskService;
    }

    // ── GET /api/security-checks/my-decisions ─────────────────────────────────

    @GetMapping("/my-decisions")
    public List<SecurityCheck> myDecisions(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return repo.findByReviewer(requireUsername(authHeader));
    }

    // ── GET /api/security-checks/{id} ────────────────────────────────────────

    @GetMapping("/{id}")
    public SecurityCheck getById(
            @PathVariable long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireUsername(authHeader);
        return repo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "SecurityCheck " + id + " not found"));
    }

    // ── POST /api/security-checks/{id}/decide ─────────────────────────────────

    @PostMapping("/{id}/decide")
    public ResponseEntity<Void> decide(
            @PathVariable long id,
            @RequestBody DecisionRequest req,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = requireUsername(authHeader);
        SecurityCheck sc = repo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "SecurityCheck " + id + " not found"));

        String decision = req.getDecision();

        // Persist to DB — always store the reviewer so stats can track who decided
        repo.updateDecision(id,
            "PENDING",           // kept PENDING until BPMN service task updates it (APPROVE/REFUSE paths)
            req.getReliability(),
            req.getNote(),
            username,
            req.getClarificationQuestion(),
            null);

        // Complete the BPMN task with local variables
        Map<String, Object> vars = new HashMap<>();
        vars.put("securityDecision", decision);
        if (req.getReliability()          != null) vars.put("reliability",            req.getReliability());
        if (req.getNote()                 != null) vars.put("securityNote",            req.getNote());
        if (req.getClarificationQuestion()!= null) vars.put("clarificationQuestion",   req.getClarificationQuestion());
        if ("ASK_INVITER".equals(decision))         vars.put("securityReviewer",        username);

        // Increment clarification count when ASK_INVITER so the frontend can show history
        if ("ASK_INVITER".equals(decision)) {
            repo.incrementClarificationCount(id);
        }

        taskService.complete(req.getTaskId(), vars);

        return ResponseEntity.noContent().build();
    }

    // ── POST /api/security-checks/{id}/clarify ────────────────────────────────

    @PostMapping("/{id}/clarify")
    public ResponseEntity<Void> clarify(
            @PathVariable long id,
            @RequestBody ClarifyRequest req,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        requireUsername(authHeader);
        repo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "SecurityCheck " + id + " not found"));

        repo.updateClarificationAnswer(id, req.getAnswer());

        Map<String, Object> vars = new HashMap<>();
        vars.put("clarificationAnswer", req.getAnswer());
        taskService.complete(req.getTaskId(), vars);

        return ResponseEntity.noContent().build();
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public static class DecisionRequest {
        private String  taskId;
        private String  decision; // APPROVE | REFUSE | BLACKLIST | ASK_INVITER
        private Integer reliability;
        private String  note;
        private String  clarificationQuestion;

        public String  getTaskId()                 { return taskId; }
        public void    setTaskId(String v)          { this.taskId = v; }
        public String  getDecision()               { return decision; }
        public void    setDecision(String v)        { this.decision = v; }
        public Integer getReliability()             { return reliability; }
        public void    setReliability(Integer v)    { this.reliability = v; }
        public String  getNote()                   { return note; }
        public void    setNote(String v)            { this.note = v; }
        public String  getClarificationQuestion()  { return clarificationQuestion; }
        public void    setClarificationQuestion(String v) { this.clarificationQuestion = v; }
    }

    public static class ClarifyRequest {
        private String taskId;
        private String answer;

        public String getTaskId() { return taskId; }
        public void   setTaskId(String v) { this.taskId = v; }
        public String getAnswer() { return answer; }
        public void   setAnswer(String v) { this.answer = v; }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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
