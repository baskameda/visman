package eu.poc.claude.invitation;

import eu.poc.claude.entrance.EntranceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/visits")
public class VisitController {

    private final VisitRepository       visitRepo;
    private final EntranceRepository    entranceRepo;

    public VisitController(VisitRepository visitRepo, EntranceRepository entranceRepo) {
        this.visitRepo    = visitRepo;
        this.entranceRepo = entranceRepo;
    }

    // ── GET /api/visits/my ────────────────────────────────────────────────────

    /**
     * Returns all visits for the entrances this gatekeeper is assigned to.
     * If the gatekeeper has no entrances, returns an empty list.
     */
    @GetMapping("/my")
    public List<Visit> myVisits(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        String username = requireUsername(authHeader);
        List<Long> entranceIds = entranceRepo.findByGatekeeper(username)
                                             .stream().map(e -> e.getId()).toList();
        if (from != null && to != null) {
            return visitRepo.findByEntrancesAndDateRange(
                entranceIds, LocalDate.parse(from), LocalDate.parse(to));
        }
        return visitRepo.findByEntrances(entranceIds);
    }

    // ── GET /api/visits/my/date-index ─────────────────────────────────────────

    /**
     * Lightweight endpoint: returns visit counts grouped by date.
     * Used by the gatekeeper dashboard to build the month/week accordion
     * without loading full visit data upfront.
     */
    @GetMapping("/my/date-index")
    public List<VisitRepository.DateCount> myDateIndex(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = requireUsername(authHeader);
        List<Long> entranceIds = entranceRepo.findByGatekeeper(username)
                                             .stream().map(e -> e.getId()).toList();
        return visitRepo.findDateIndexByEntrances(entranceIds);
    }

    // ── GET /api/visits/my-checkins ───────────────────────────────────────────

    /**
     * Returns all visits that were checked in by the current gatekeeper.
     * Used for historical stats / gamification panel.
     */
    @GetMapping("/my-checkins")
    public List<Visit> myCheckins(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = requireUsername(authHeader);
        return visitRepo.findByCheckedInBy(username);
    }

    // ── PUT /api/visits/{id}/checkin ──────────────────────────────────────────

    @PutMapping("/{id}/checkin")
    public ResponseEntity<Void> checkIn(
            @PathVariable long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String username = requireUsername(authHeader);

        // Verify visit exists
        visitRepo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Visit " + id + " not found"));

        boolean updated = visitRepo.checkIn(id, username);
        if (!updated) {
            // Visit exists but is not in PENDING status
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Visit " + id + " cannot be checked in (already checked in or no-show)");
        }

        return ResponseEntity.noContent().build();
    }

    // ── GET /api/visits/{id} ──────────────────────────────────────────────────

    @GetMapping("/{id}")
    public Visit getById(
            @PathVariable long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireUsername(authHeader);
        return visitRepo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Visit " + id + " not found"));
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
