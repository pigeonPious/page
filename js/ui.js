// js/ui.js

// --- Corner Logo ---
export function initializeCornerLogo() {
    const cornerGif = document.getElementById('cornerGif');
    if (!cornerGif) return;

    // In a real app, this might come from a config file
    cornerGif.style.backgroundImage = `url('assets/piousPigeon_logo_bird-export.png')`;
}

// --- Hover Notes ---
export function initializeHoverNotes() {
    const hoverNote = document.getElementById('hoverNote');
    if (!hoverNote) return;

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.note-link');
        if (target && target.dataset.note) {
            hoverNote.textContent = target.dataset.note;
            hoverNote.style.display = 'block';
            positionNote(e);
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.note-link')) {
            hoverNote.style.display = 'none';
        }
    });

    document.addEventListener('mousemove', positionNote);

    function positionNote(e) {
        if (hoverNote.style.display === 'block') {
            hoverNote.style.left = `${e.clientX + 15}px`;
            hoverNote.style.top = `${e.clientY + 15}px`;
        }
    }
}
