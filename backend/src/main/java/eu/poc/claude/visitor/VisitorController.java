package eu.poc.claude.visitor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/visitors")
public class VisitorController {

    private final VisitorRepository repo;

    public VisitorController(VisitorRepository repo) {
        this.repo = repo;
    }

    // ── POST /api/visitors ────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<Visitor> create(
            @RequestBody Visitor visitor,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = requireUsername(authHeader);
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(visitor, username));
    }

    // ── GET /api/visitors/search ──────────────────────────────────────────────

    @GetMapping("/search")
    public List<Visitor> search(
            @RequestParam(defaultValue = "") String q,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = requireUsername(authHeader);
        return repo.search(q.trim(), username);
    }

    // ── GET /api/visitors/blacklisted  (Security view — all owners) ───────────

    @GetMapping("/blacklisted")
    public List<Visitor> blacklisted(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireUsername(authHeader); // authentication required, no ownership filter
        return repo.findAllBlacklisted();
    }

    // ── PUT /api/visitors/{id}/blacklist  (add to blacklist) ──────────────────

    @PutMapping("/{id}/blacklist")
    public ResponseEntity<Void> blacklist(
            @PathVariable long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireUsername(authHeader);
        repo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Visitor " + id + " not found"));
        repo.updateBlacklist(id, true);
        return ResponseEntity.noContent().build();
    }

    // ── DELETE /api/visitors/{id}/blacklist  (remove from blacklist) ──────────

    @DeleteMapping("/{id}/blacklist")
    public ResponseEntity<Void> unblacklist(
            @PathVariable long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireUsername(authHeader);
        repo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Visitor " + id + " not found"));
        repo.updateBlacklist(id, false);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String requireUsername(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Basic ")) {
            try {
                String decoded = new String(Base64.getDecoder().decode(authHeader.substring(6)));
                String[] parts = decoded.split(":", 2);
                if (parts.length >= 1 && !parts[0].isBlank()) return parts[0];
            } catch (IllegalArgumentException ignored) {}
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
            "Valid Basic Auth credentials required");
    }
}
