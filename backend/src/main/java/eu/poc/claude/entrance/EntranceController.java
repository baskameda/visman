package eu.poc.claude.entrance;

import org.operaton.bpm.engine.IdentityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/entrances")
public class EntranceController {

    private final EntranceRepository repo;
    private final IdentityService    identityService;

    public EntranceController(EntranceRepository repo, IdentityService identityService) {
        this.repo            = repo;
        this.identityService = identityService;
    }

    // ── GET /api/entrances  (any authenticated user: list all entrances) ────────

    @GetMapping
    public List<Entrance> findAll(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireUsername(authHeader);
        return repo.findAll();
    }

    // ── GET /api/entrances/my  (gatekeeper: own assigned entrances) ───────────

    @GetMapping("/my")
    public List<Entrance> myEntrances(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = requireUsername(authHeader);
        return repo.findByGatekeeper(username);
    }

    // ── POST /api/entrances ───────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<Entrance> create(
            @RequestBody Entrance entrance,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        if (entrance.getName() == null || entrance.getName().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(entrance));
    }

    // ── PUT /api/entrances/{id} ───────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable long id,
            @RequestBody Entrance entrance,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        if (entrance.getName() == null || entrance.getName().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        if (!repo.update(id, entrance))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrance " + id + " not found");
        return ResponseEntity.noContent().build();
    }

    // ── DELETE /api/entrances/{id} ────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        if (!repo.delete(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrance " + id + " not found");
        return ResponseEntity.noContent().build();
    }

    // ── GET /api/entrances/{id}/gatekeepers ───────────────────────────────────

    @GetMapping("/{id}/gatekeepers")
    public List<String> getGatekeepers(
            @PathVariable long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        repo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrance " + id + " not found"));
        return repo.findGatekeepers(id);
    }

    // ── PUT /api/entrances/{id}/gatekeepers ───────────────────────────────────

    @PutMapping("/{id}/gatekeepers")
    public ResponseEntity<Void> setGatekeepers(
            @PathVariable long id,
            @RequestBody List<String> usernames,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        repo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrance " + id + " not found"));
        repo.setGatekeepers(id, usernames);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String decodeUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Basic ")) return null;
        try {
            String decoded = new String(Base64.getDecoder().decode(authHeader.substring(6)));
            String[] parts = decoded.split(":", 2);
            return (parts.length >= 1 && !parts[0].isBlank()) ? parts[0] : null;
        } catch (IllegalArgumentException e) { return null; }
    }

    private String requireUsername(String authHeader) {
        String u = decodeUsername(authHeader);
        if (u == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        return u;
    }

    private void requireAdmin(String authHeader) {
        String username = requireUsername(authHeader);
        boolean isAdmin = identityService.createGroupQuery()
                .groupMember(username).groupId("webAdmins").count() > 0;
        if (!isAdmin)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Only administrators can manage entrances");
    }
}
