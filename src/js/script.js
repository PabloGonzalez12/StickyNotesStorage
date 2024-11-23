import { DatabaseManager } from "./indexedDB.js";
const dbManager = DatabaseManager.getInstance();

const mainElement = document.querySelector("main");
const buttonElement = document.getElementById("addButton");
const noteColorElement = document.getElementById("noteColor");
var counterID = 1;
var selectedColor = "red";

noteColorElement.addEventListener("change", function () {
    selectedColor = this.value;
});

buttonElement.addEventListener("click", () => {
    let newNote = document.createElement("div");
    newNote.classList.add("note");
    newNote.id = "note-" + counterID;

    newNote.innerHTML = `
        <div class="noteHeader" style="background-color: ${selectedColor};">
            <button class="close">X</button>
        </div>
        <div class="noteBody">
            <textarea name="noteText" class="noteText"></textarea>
        </div>
    `;

    mainElement.appendChild(newNote);
    counterID++;
});

mainElement.addEventListener("click", function (event) {
    if (event.target.classList.contains("close")) {
        event.target.closest(".note").remove();
    }
});

let cursor = { x: null, y: null };
let note = { dom: null, x: null, y: null };
let zIndex = 0;

mainElement.addEventListener("mousedown", function (event) {
    if (event.target.classList.contains("noteHeader")) {
        cursor = {
            x: event.clientX,
            y: event.clientY,
        };

        note = {
            dom: event.target.closest(".note"),
            x: event.target.closest(".note").offsetLeft,
            y: event.target.closest(".note").offsetTop,
        };

        zIndex += 1;
        event.target.closest(".note").style.zIndex = zIndex;
    }
});

mainElement.addEventListener("mousemove", function (event) {
    if (note.dom == null) {
        return;
    }

    let currentCursor = {
        x: event.clientX,
        y: event.clientY,
    };

    let distance = {
        x: currentCursor.x - cursor.x,
        y: currentCursor.y - cursor.y,
    };

    note.dom.style.left = note.x + distance.x + "px";
    note.dom.style.top = note.y + distance.y + "px";
});

mainElement.addEventListener("mouseup", function () {
    if (note.dom == null) {
        return;
    }
    note.dom = null;
});



// Save and load notes to IndexedDB

async function saveNotes() {
    try {
        // Ensure the database is open
        await dbManager.open();

        const notes = document.querySelectorAll(".note");
        // Clear existing notes in IndexedDB.
        await dbManager.clearStore();

        // Iterate over each note on the page
        notes.forEach(async (note) => {
            // Extract the note's data (position, color, text content)
            const noteData = {
                top: note.style.top,
                left: note.style.left,
                backgroundColor: note.querySelector(".noteHeader").style.backgroundColor,
                text: note.querySelector(".noteText").value,
                zIndex: note.style.zIndex
            };

            // Save the note data to IndexedDB
            await dbManager.createData(noteData);
        });
    } catch (error) {
        console.error("Error saving notes:", error);
    }
}

async function loadNotes() {
    try {
        // Ensure the database is open
        await dbManager.open();
        // Retrieve all notes from IndexedDB
        const notes = await dbManager.readAllData();

        // Iterate over the retrieved notes
        notes.forEach((note) => {
            // Create a new note element on the page
            let newNote = document.createElement("div");
            newNote.classList.add("note");
            newNote.id = "note-" + note.id;
            newNote.style.top = note.top;
            newNote.style.left = note.left;
            newNote.style.zIndex = note.zIndex;

            // Populate the note with the retrieved data
            newNote.innerHTML = `
            <div class="noteHeader" style="background-color: ${note.backgroundColor};">
                <button class="close">X</button>
            </div>
            <div class="noteBody">
                <textarea name="noteText" class="noteText">${note.text}</textarea>
            </div>
        `;

            // Add the new note to the page
            mainElement.appendChild(newNote);

            // Update the counter to prevent ID collisions
            counterID = Math.max(counterID, note.id + 1);
        });
    } catch (error) {
        console.error("Error loading notes:", error);
    }
}

// Save notes before the page is unloaded
window.addEventListener('beforeunload', saveNotes);
// Load notes when the page loads
window.addEventListener('load', loadNotes);