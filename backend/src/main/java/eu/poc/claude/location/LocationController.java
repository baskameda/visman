package eu.poc.claude.location;

import org.operaton.bpm.engine.IdentityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationRepository repo;
    private final IdentityService    identityService;

    public LocationController(LocationRepository repo, IdentityService identityService) {
        this.repo            = repo;
        this.identityService = identityService;
    }

    // ── GET /api/locations ────────────────────────────────────────────────────
    // Public — called by the login page before authentication.

    @GetMapping
    public List<Location> findAll() {
        return repo.findAll();
    }

    // ── GET /api/locations/{id}/users ─────────────────────────────────────────
    // Public — called by the login page to populate the quick-fill list.

    @GetMapping("/{id}/users")
    public List<LocationRepository.LocationUser> getUsersByLocation(@PathVariable long id) {
        return repo.findUsersByLocation(id);
    }

    // ── POST /api/locations ───────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<Location> create(
            @RequestBody Location location,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        if (location.getName() == null || location.getName().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        if (location.getLatitude() == null || location.getLongitude() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "latitude and longitude are required");
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(location));
    }

    // ── PUT /api/locations/{id} ───────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable long id,
            @RequestBody Location location,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        if (location.getName() == null || location.getName().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        if (location.getLatitude() == null || location.getLongitude() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "latitude and longitude are required");
        if (!repo.update(id, location))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Location " + id + " not found");
        return ResponseEntity.noContent().build();
    }

    // ── DELETE /api/locations/{id} ────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        repo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Location " + id + " not found"));
        if (repo.countEntrances(id) > 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Remove all entrances from this location before deleting it");
        if (!repo.delete(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Location " + id + " not found");
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
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admins only");
    }
}
