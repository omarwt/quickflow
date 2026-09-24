package com.quickflow.learning;

import com.quickflow.common.NotFoundException;
import com.quickflow.learning.LearningCard.Milestone;
import com.quickflow.learning.LearningCard.Note;
import com.quickflow.learning.LearningCard.Status;
import com.quickflow.learning.LearningDtos.CardRequest;
import com.quickflow.learning.LearningDtos.CardResponse;
import com.quickflow.learning.LearningDtos.MilestoneRequest;
import com.quickflow.learning.LearningDtos.MilestoneUpdate;
import com.quickflow.learning.LearningDtos.NoteRequest;
import com.quickflow.settings.SettingsService;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class LearningService {

    private final LearningCardRepository cards;
    private final SettingsService time;

    public LearningService(LearningCardRepository cards, SettingsService time) {
        this.cards = cards;
        this.time = time;
    }

    @Transactional(readOnly = true)
    public List<CardResponse> list() {
        return cards.findAllByOrderByIdAsc().stream().map(CardResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public CardResponse get(long id) {
        return CardResponse.of(load(id));
    }

    /** For other features (plans): empty if the card was deleted. */
    @Transactional(readOnly = true)
    public Optional<CardResponse> find(long id) {
        return cards.findById(id).map(CardResponse::of);
    }

    @Transactional
    public CardResponse create(CardRequest r) {
        LearningCard c = new LearningCard();
        c.createdAt = time.now();
        apply(c, r);
        return CardResponse.of(cards.save(c));
    }

    @Transactional
    public CardResponse update(long id, CardRequest r) {
        LearningCard c = load(id);
        apply(c, r);
        return CardResponse.of(c);
    }

    @Transactional
    public void delete(long id) {
        cards.delete(load(id));
    }

    @Transactional
    public CardResponse addMilestone(long cardId, MilestoneRequest r) {
        LearningCard c = load(cardId);
        Milestone m = new Milestone();
        m.title = r.title().trim();
        m.targetDate = r.targetDate();
        c.milestones.add(m);
        return CardResponse.of(cards.saveAndFlush(c));
    }

    @Transactional
    public CardResponse updateMilestone(long cardId, long milestoneId, MilestoneUpdate r) {
        LearningCard c = load(cardId);
        Milestone m = milestone(c, milestoneId);
        if (r.title() != null) m.title = r.title().trim();
        if (r.targetDate() != null) m.targetDate = r.targetDate();
        if (r.done() != null) m.setDone(r.done(), time.now());
        return CardResponse.of(c);
    }

    @Transactional
    public CardResponse removeMilestone(long cardId, long milestoneId) {
        LearningCard c = load(cardId);
        c.milestones.remove(milestone(c, milestoneId));
        return CardResponse.of(c);
    }

    @Transactional
    public CardResponse addNote(long cardId, NoteRequest r) {
        LearningCard c = load(cardId);
        Note n = new Note();
        n.text = r.text().trim();
        n.createdAt = time.now();
        c.notes.add(n);
        return CardResponse.of(cards.saveAndFlush(c));
    }

    @Transactional
    public CardResponse removeNote(long cardId, long noteId) {
        LearningCard c = load(cardId);
        Note n = c.notes.stream().filter(x -> x.id == noteId).findFirst()
                .orElseThrow(() -> new NotFoundException("Note", noteId + " on card " + cardId));
        c.notes.remove(n);
        return CardResponse.of(c);
    }

    private static Milestone milestone(LearningCard c, long id) {
        return c.milestones.stream().filter(m -> m.id == id).findFirst()
                .orElseThrow(() -> new NotFoundException("Milestone", id + " on card " + c.id));
    }

    private void apply(LearningCard c, CardRequest r) {
        c.title = r.title().trim();
        c.description = StringUtils.hasText(r.description()) ? r.description().trim() : null;
        c.status = r.status() == null ? Status.NOT_STARTED : r.status();
    }

    private LearningCard load(long id) {
        return cards.findById(id).orElseThrow(() -> new NotFoundException("Learning card", id));
    }
}
