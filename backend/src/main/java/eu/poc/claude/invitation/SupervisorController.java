package eu.poc.claude.invitation;

import org.operaton.bpm.engine.IdentityService;
import org.operaton.bpm.engine.identity.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/supervisor")
public class SupervisorController {

    private final SupervisorRepository   supervisorRepo;
    private final InvitationRepository   invitationRepo;
    private final IdentityService        identityService;

    public SupervisorController(SupervisorRepository supervisorRepo,
                                 InvitationRepository invitationRepo,
                                 IdentityService identityService) {
        this.supervisorRepo  = supervisorRepo;
        this.invitationRepo  = invitationRepo;
        this.identityService = identityService;
    }

    // ── GET /api/supervisor/am-i-supervisor ───────────────────────────────────

    @GetMapping("/am-i-supervisor")
    public Map<String, Boolean> amISupervisor(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = requireUsername(authHeader);
        return Map.of("supervisor", supervisorRepo.isSupervisor(username));
    }

    // ── GET /api/supervisor/supervisee-invitations ─────────────────────────────

    /**
     * Returns all invitations belonging to this supervisor's supervisees,
     * enriched with the same status computation as the inviter's own dashboard.
     */
    @GetMapping("/supervisee-invitations")
    public List<Invitation> superviseeInvitations(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = requireUsername(authHeader);
        requireSupervisor(username);
        List<String> supervisees = supervisorRepo.findSupervisees(username);
        if (supervisees.isEmpty()) return List.of();
        return invitationRepo.findByInviters(supervisees);
    }

    // ── POST /api/supervisor/claim/{invitationId}/visitor/{visitorId} ──────────

    /**
     * Claims a specific visitor's security check and all future visits for this supervisor.
     * Reassigns the entire invitation's inviter_username to the supervisor.
     */
    @PostMapping("/claim/{invitationId}/visitor/{visitorId}")
    public ResponseEntity<Void> claim(
            @PathVariable long invitationId,
            @PathVariable long visitorId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = requireUsername(authHeader);
        requireSupervisor(username);

        // Verify the invitation belongs to one of this supervisor's supervisees
        Invitation inv = invitationRepo.findById(invitationId).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation " + invitationId + " not found"));

        List<String> supervisees = supervisorRepo.findSupervisees(username);
        if (!supervisees.contains(inv.getInviterUsername())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Invitation does not belong to one of your supervisees");
        }

        // Reassign the entire invitation to the supervisor
        invitationRepo.updateInviterUsername(invitationId, username);

        return ResponseEntity.noContent().build();
    }

    // ── Admin: GET /api/supervisor/assignments ────────────────────────────────

    @GetMapping("/assignments")
    public List<SupervisorRepository.Assignment> listAssignments(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        return supervisorRepo.findAll();
    }

    // ── Admin: PUT /api/supervisor/assignments ────────────────────────────────

    @PutMapping("/assignments")
    public ResponseEntity<Void> assign(
            @RequestBody AssignmentRequest req,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);

        // Check the 10-supervisee cap — only when the target supervisor would gain a new supervisee
        String currentSupervisor = supervisorRepo.findSupervisorOf(req.inviterUsername());
        if (!req.supervisorUsername().equals(currentSupervisor)) {
            int count = supervisorRepo.countSupervisees(req.supervisorUsername());
            if (count >= 10) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    req.supervisorUsername() + " already supervises 10 inviters — maximum reached");
            }
        }

        supervisorRepo.assign(req.inviterUsername(), req.supervisorUsername());
        return ResponseEntity.noContent().build();
    }

    // ── Admin: DELETE /api/supervisor/assignments/{inviterUsername} ────────────

    @DeleteMapping("/assignments/{inviterUsername}")
    public ResponseEntity<Void> remove(
            @PathVariable String inviterUsername,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        supervisorRepo.remove(inviterUsername);
        return ResponseEntity.noContent().build();
    }

    // ── Admin: GET /api/supervisor/inviters ───────────────────────────────────

    /**
     * Returns all users in the Invitors group (for the admin assignment UI).
     */
    @GetMapping("/inviters")
    public List<Map<String, String>> listInviters(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAdmin(authHeader);
        List<User> users = identityService.createUserQuery().memberOfGroup("Invitors").list();
        return users.stream()
            .map(u -> Map.of(
                "username",  u.getId(),
                "firstName", u.getFirstName() != null ? u.getFirstName() : "",
                "lastName",  u.getLastName()  != null ? u.getLastName()  : ""))
            .toList();
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public record AssignmentRequest(String inviterUsername, String supervisorUsername) {}

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void requireSupervisor(String username) {
        if (!supervisorRepo.isSupervisor(username))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a supervisor");
    }

    private void requireAdmin(String authHeader) {
        String username = requireUsername(authHeader);
        boolean isAdmin = identityService.createGroupQuery()
            .groupMember(username).groupId("webAdmins").count() > 0;
        if (!isAdmin)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrators only");
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
