// Global Constants 
let count = 0;
let rightClickMenuToggle = false;
let changeAccSettingsToggle = false;
let originalDivStructure;  
const addBtn = document.getElementById('new-note');
const deleteAllNotesBtn = document.getElementById('delete-all-notes');
const saveAllNotesBtn = document.getElementById('save-notes');
const histBtn = document.getElementById('note-history');
const aboutBtn = document.getElementById('about');
const loginBtn = document.getElementById('login');
const accountBtn = document.getElementById('account-profile');
const saveChanges = document.querySelector('.button.save-account-changes');
const closeBtn = document.querySelector('.button.close-account-btn');
const bulletsymbols = ['•','◦', '▪', '‣'];
const userData = getGuestMode();
import {getGuestMode, setGuestMode} from '../utilities.js';

console.log('userData:', userData);

if (userData?.email) {
  console.log('No email exists');
} else {
  console.log('There exists an email');
}
// menu buttons
addBtn.addEventListener('click', function() {
    addNote();
});

deleteAllNotesBtn.addEventListener('click', function() {
    for (let i = 0; i < count; i++) {
        const currNote = document.getElementById(`note-${i}`);
        currNote.delete();
    }
    count = 0;
});

saveAllNotesBtn.addEventListener('click', function() {
    saveToLocalStorage();
});

aboutBtn.addEventListener('click', function() {
    window.open('about.html', '_blank');
});

loginBtn.addEventListener('click', function() {
    window.open('login.html', '_blank');
});

accountBtn.addEventListener('click', function() {
    const accountProf = document.querySelector('.account-container');
    if (accountProf.style.display === 'none') {
        accountProf.style.display = 'grid';
        dragElement(accountProf);
        return;
    }
    accountProf.style.display = 'none';
});

document.getElementById('account-settings').addEventListener('click', function() {
    const changeAccSettings = document.getElementById('account-settings-cont');
    if (changeAccSettings.style.display === 'none') {
        changeAccSettings.style.display = 'grid';
        dragElement(changeAccSettings);
        return;
    }
    changeAccSettings.style.display = 'none';
});

saveChanges.addEventListener('click', function() {
    console.log(document.getElementById('old-pwd').textContent);
    console.log('Password is about to be changed');
    fetch('/change-password', {
        method: 'POST', 
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({pwd: document.getElementById('old-pwd').textContent, email: userData.email})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Nothing');
    })
    .catch(err => {
        console.error('Error fetching account data:', err);
    }); 
});

closeBtn.addEventListener('click', function() {
    changeAccSettingsToggle = false;
    document.getElementById('account-settings-cont').style.display = 'none';
});

document.getElementById('logout').addEventListener('click', function() {
    setGuestMode(true);
    window.open('index.html', '_blank');
});


if (userData && userData.exists === false) {
    console.log("There's an account registered");
    const url = new URL('/account', window.location.origin);
    url.searchParams.append('email', decodeURIComponent(userData.email))
    fetch(url) 
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Response from the backend', data);
        const accountBtn = document.getElementById('account-profile');
        loginBtn.style.display = 'none';
        accountBtn.style.display = 'grid';
        accountBtn.innerHTML = `${data.username}`;
        document.getElementById('old-pwd').textContent = `${data.pwd}`;        
        // document.getElementById('old-pwd').textContent = `${data.usr_pwd}`;
    })
    .catch(err => {
        console.error('Error fetching account data:', err);
    });
}

function saveANote(note) {
    const contentBox = note.querySelector('.content');
    const noteContent = contentBox.querySelectorAll('.line-content');
    const noteTitle = note.querySelector('.title').textContent.trim();
    let contentArray = [];
    console.log(contentBox);
    console.log(noteTitle);
    noteContent.forEach((div) => {
        if (div.parentNode.className === "line") {
            let indentHelper = '';
            let indentLevel = (parseInt(div.parentNode.style.marginLeft) / 20) || 0;
            for (let i = 0; i < indentLevel; i++) {
                console.log(indentLevel);
                indentHelper += '\u2003';
            }
            contentArray.push(indentHelper + div.previousElementSibling.innerHTML + div.textContent);
        }
        else {
            contentArray.push(div.textContent);
        }
    });
    fetch('/upload-blob-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `${noteTitle}.txt`, content: contentArray }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.blob(); 
        })
        .then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${noteTitle}.txt`; 
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url); 
        })
        .catch((error) => console.error('Download failed:', error));
    
}

// saving notes to local storage
function saveToLocalStorage() {
    const notesContent = document.querySelectorAll('.note-box .content');
    const titles = document.querySelectorAll('.note-box .title');
    const data = [];
    notesContent.forEach((note, index) => {
        const content = note.innerHTML;
        const title = titles[index].textContent;
        if (content.trim() != "") {
            data.push({title, content});
        }
    });

    const titlesData = data.map((item) => item.title);
    localStorage.setItem(
        "titles", JSON.stringify(titlesData)
    );
    const contentData = data.map((item) => item.content);
    localStorage.setItem(
        "notes", JSON.stringify(contentData)
    );
    saveStyles();
}

function saveStyles() {

    for (let i = 0; i < count; i++) {
        const noteId = `note-${i}`;
        const note = document.getElementById(noteId);

        if (note) {
            const styles = window.getComputedStyle(note);
            const styleObject = {};

            for (let property of styles) {
                if (property === 'top' || property === 'left') {
                    styleObject[property] = styles.getPropertyValue(property);
                }
            }
            localStorage.setItem(`savedStyles-${noteId}`, JSON.stringify(styleObject));
        }
        else {
            console.log(`Note with ID ${noteId} is not found.`)
        }
    }
}

function copy(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy text', err)
        });
    } 
    else {
        document.execCommand('copy');
        console.log('Text copied to clipboard');
    }
}

function rightClickMenu(selectedText, mouseX, mouseY, note) {
    addRightClickMenu(selectedText, mouseX, mouseY, note);
}

const addRightClickMenu = (text, mouseX, mouseY, note) => {
    const menu = document.createElement('div');
    const noteContainer = document.getElementById('note-div');
    const noteContent = note.querySelector('.content');
    menu.classList.add('right-click-menu');
    menu.id = 'right-click-menu-id';
    if (menu.id) {
        deleteRightClickMenu();
    }
    menu.innerHTML = `
            <button class="button ask-Google" id="ask-Google">Search on Google</button>
            <button class="button cut" id="cut-selected-text">Cut</button>
            <button class="button copy" id="copy-selected-text">Copy</button>
            <button class="button paste" id="paste-copied-text">Paste</button> 
    `;
    noteContainer.appendChild(menu);
    menu.style.top = mouseY + 'px';
    menu.style.left = mouseX + 'px';
    rightClickMenuToggle = true;
    menu.addEventListener('click', async function(event) {
        if (event.target.classList.contains('ask-Google')) {
            const googleSearchUrl = `https://www.google.com/search?q=${text}`;
            window.open(googleSearchUrl, '_blank');
        }
        else if (event.target.classList.contains('cut')) {
            const caretPosition = noteContent.selectionStart;
            copy(text);
            const restOfText = noteContent.value.slice(0, caretPosition) + noteContent.value.slice(caretPosition + text.length, noteContent.end);
            noteContent.value = restOfText;

        }
        else if (event.target.classList.contains('copy')) {
            copy(text);
        }
        else if (event.target.classList.contains('paste')) {
            if (navigator.clipboard) {
                const copiedText = await navigator.clipboard.readText();
                const caretPosition = noteContent.selectionStart;
                const textBeforeCaret = noteContent.value.slice(0, caretPosition);
                noteContent.value = textBeforeCaret + copiedText + noteContent.value.slice(caretPosition, noteContent.end);
            }
            else {
                alert('Clipboard API is not working.');
            }
        }
    })

}

function deleteRightClickMenu() {
    const menu = document.querySelector('.right-click-menu');
    if (menu) {
        menu.remove();
        rightClickMenuToggle = false;
    }
    else {
        console.log('No menu created.');
    }
}

const addNote = (text = "", title = "") => {
    const note = document.createElement("div");
    const noteContainer = document.getElementById('note-div');
    const sampleTitle = `Untitled`;
    const sampleCont = `<div id="default-line" class="non-bullet-line">
        <div class="line-content" contenteditable="true">Hello World</div>
    </div>`
    
    note.classList.add("note-box");
    note.id = `note-${count}`;
    note.innerHTML = `
        <div class="icons">
            <button class="button save-note" data-note-id="${count}">Save note</a>
            <button class="button delete-note" data-note-id="${count}">Delete note</button>
            <button class="button add-bulletpoints" data-note-id="${count}">Add bulletpoints</button>
        </div>
        <div class="title-div-note">
            <div contenteditable="true" class="title">
                ${title || sampleTitle}
            </div>
        </div>
        <div contenteditable="false" class="content">
            ${text || (sampleCont)}
        </div>
    `;

    noteContainer.appendChild(note);
    dragElement(note);
    count++; 
    let enableBulletPoints = false;
    let defaultLine = title ? false : true;
    let lastDeletedContent = '';


    noteContainer.addEventListener('click', function(event) {
        const noteId = event.target.getAttribute('data-note-id');
        const currentNote = document.getElementById(`note-${noteId}`);
        if (event.target.classList.contains('delete-note')) {
            if (currentNote) {
                currentNote.remove();
                count--;
                saveToLocalStorage();
            }
        }
        else if (event.target.classList.contains('save-note')) {
            saveANote(currentNote);
            saveToLocalStorage();
            console.log('Note saved');
        }
    });

    const noteContent = note.querySelector('.content');
    noteContent.addEventListener('keydown', function(event) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (event.key === 'Tab') {
            event.preventDefault();
            
            if (enableBulletPoints) {
                const bulletLine = range.commonAncestorContainer.parentNode.closest('.line'); // Or the bullet line's container class
                
                if (!bulletLine) return;
    
                // Get current indent level
                let indentLevel = (parseInt(bulletLine.style.marginLeft) / 20) || 0;
                
                if (!event.shiftKey) {
                    if (indentLevel === bulletsymbols.length - 1) return;
                    indentLevel++;
                    bulletLine.style.marginLeft = (parseInt(bulletLine.style.marginLeft) || 0) + 20 + 'px';
                } else {
                    indentLevel = Math.max(0, indentLevel - 1);
                    const currentIndent = parseInt(bulletLine.style.marginLeft) || 0;
                    bulletLine.style.marginLeft = Math.max(0, currentIndent - 20) + 'px';
                }
    
                // Update bullet symbol based on indent level
                const newBullet = bulletsymbols[indentLevel % bulletsymbols.length];
                let bulletSpan = bulletLine.querySelector('.bullet-point');
                if (!bulletSpan)  {
                    bulletSpan = document.createElement('span');
                    bulletSpan.classList.add('bullet-point');
                    bulletLine.prepend(bulletSpan);
                }
                bulletSpan.textContent = newBullet;
            } else {
                insertTab(this, '\u2003'); // Inserts an empty-space
            }
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            if (enableBulletPoints) {
                insertNewBulletPoint(this);
            }
            else {
                const newDiv = document.createElement('div');
                const contentDiv = document.createElement('div');
                contentDiv.classList.add('line-content');
                contentDiv.contentEditable = 'true';
                const br = document.createElement('br');
                newDiv.classList.add('non-bullet-line');
                contentDiv.appendChild(br);
                newDiv.appendChild(contentDiv);
        
                this.appendChild(newDiv);
        
                const range = document.createRange();
                const selection = window.getSelection();
                range.setStart(newDiv.querySelector('.line-content'), 0); 
                range.collapse(true);
                
                selection.removeAllRanges();
                selection.addRange(range);
        
                newDiv.focus(); 
            }
            defaultLine = false;
        }
        if (event.key === 'Backspace') {
            const bulletLine = range.commonAncestorContainer.parentNode.parentNode.closest('.line');
            console.log(bulletLine);
            const currLine = range.commonAncestorContainer;
            const priorLine = bulletLine ? bulletLine.previousElementSibling : null;
            if (!range.collapsed) {
                event.preventDefault();
                lastDeletedContent = range.toString();
                range.deleteContents();
            } else if (bulletLine) {
                event.preventDefault();
                const lineContent = bulletLine.querySelector('.line-content').textContent.trim();
                let isLineRemoved = false;
                if (lineContent === '' || lineContent === '\u200B') {
                    bulletLine.remove();
                    isLineRemoved = true;
                }
                else if (range.startOffset > 0) {
                    const textNode = range.startContainer;
                    textNode.deleteData(range.startOffset - 1, 1);
                    range.setStart(textNode, range.startOffset);
                    range.collapse(true);
                }
                if (priorLine && isLineRemoved) {
                    const newRange = document.createRange();
                    const lineContent = priorLine.querySelector('.line-content');
                    const newTextLine = lineContent && lineContent.firstChild ? lineContent.firstChild : priorLine; // Currently having an issue with the bulletpoint thing where it focuses on the 
                    // const newTextLine = priorLine.querySelector('.line-content').firstChild ? priorLine.querySelector('.line-content').firstChild : priorLine.querySelector('.line-content');
                    newRange.selectNodeContents(newTextLine);
                    newRange.collapse(false);
    
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    priorLine.focus();
                }
            }
            else if (currLine && range.collapsed) {
                const priorLine = currLine.parentNode.previousElementSibling;
                if (!priorLine) {
                    if (currLine.parentNode.parentNode.id === 'default-line') {
                        console.log("it actually hits content");
                        defaultLine = true;
                        return;
                    }
                    if (currLine.className === "line-content" && defaultLine) {
                        console.log("it hits content");
                        event.preventDefault();
                        return;
                    }
                    if (currLine.length === 0 && defaultLine) {
                        event.preventDefault();
                        return;
                    }
                    return;
                }
                this.removeChild(currLine.parentNode);
                const newRange = document.createRange();
                const newTextLine = priorLine.querySelector('.line-content') ? priorLine.querySelector('.line-content') : priorLine.parentNode;
                newRange.selectNodeContents(newTextLine);
                newRange.collapse(false);

                selection.removeAllRanges();
                selection.addRange(newRange);
                priorLine.focus();
            }
        }
        
    });

    noteContent.addEventListener('contextmenu', function(event) {
        event.preventDefault();
        const selectedText = window.getSelection().toString();
        if (selectedText) {
            rightClickMenu(selectedText, event.x, event.y, note);
        }
        else {
            console.log('No text selected.');
        }
    });

    noteContent.addEventListener('click', function(event) {
        if (rightClickMenuToggle) {
            deleteRightClickMenu();
        }
    });

    const addBulletPointsBtn = note.querySelector('.add-bulletpoints');
    addBulletPointsBtn.addEventListener('click', function(event) {
        if (enableBulletPoints) {
            enableBulletPoints = false;
            addBulletPointsBtn.style.background = 'white';
            addBulletPointsBtn.style.color = 'black';
        }
        else {
            enableBulletPoints = true;
            addBulletPointsBtn.style.background = 'green';
            addBulletPointsBtn.style.color = 'white';
            insertNewBulletPoint(noteContent);
        }
    });
};

const insertTab = (element, textToInsert) => {
    // Ensure the contenteditable element is in focus
    element.focus();

    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Collapse the range to the cursor position
        range.collapse(true);

        // Create a new text node and insert it at the cursor position
        const textNode = document.createTextNode(textToInsert);
        range.insertNode(textNode);

        // Move the cursor to after the inserted text
        range.setStartAfter(textNode);
        range.collapse(true);

        // Update the selection
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

function insertNewBulletPoint(element) {
    element.focus();
    const newLine = createNewLine();
    const newEditable = newLine.querySelector('.line-content');
    element.appendChild(newLine);

    const range = document.createRange();
    const selection = window.getSelection();

    range.setStart(newEditable.firstChild, 1);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

}

// The line thingy is way too complicated, so let's clung them into one function.
function createNewLine() {
    const newLine = document.createElement('div');
    newLine.classList.add('line');
    newLine.contentEditable = 'false';
    const bullet = document.createElement('span');
    bullet.classList.add('bullet-point');
    bullet.innerHTML = `${bulletsymbols[0]}`;
    const editable = document.createElement('div');
    editable.classList.add('line-content');
    editable.contentEditable = 'true';
    editable.textContent = '\u200B';
    newLine.appendChild(bullet);
    newLine.appendChild(editable);
    return newLine;
}


function dragElement(el) {
    let isDragging = false;
    let startX, startY;

    function dragMouseDown(e) {
        // Only start drag if the click is outside of the contenteditable area
        if (!e.target.classList.contains("content") && !e.target.classList.contains("line-content") && !e.target.classList.contains("title")) {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            document.addEventListener("mousemove", elementDrag);
            document.addEventListener("mouseup", stopDrag);
        }
    }

    function elementDrag(e) {
        if (isDragging) {
            e.preventDefault();
            let posX = startX - e.clientX;
            let posY = startY - e.clientY;
            startX = e.clientX;
            startY = e.clientY;
            el.style.top = (el.offsetTop - posY) + "px";
            el.style.left = (el.offsetLeft - posX) + "px";
        }
    }

    function stopDrag() {
        isDragging = false;
        document.removeEventListener("mousemove", elementDrag);
        document.removeEventListener("mouseup", stopDrag);
    }

    // Attach the dragMouseDown only once
    el.addEventListener("mousedown", dragMouseDown);
}

function loadNotes() {
    const titlesData = JSON.parse(localStorage.getItem("titles")) || [];
    const contentData = JSON.parse(localStorage.getItem("notes")) || [];

    for (let i = 0; i < Math.max(titlesData.length, contentData.length); i++) { 
        addNote(contentData[i], titlesData[i]);
    }
}

function loadSavedStyles() {
    for (let i = 0; i < count; i++) {
        const noteId = `note-${i}`;
        const element = document.getElementById(noteId);
        const savedStyles = localStorage.getItem(`savedStyles-${noteId}`);
    
        if (savedStyles && element) {
            const styleObject = JSON.parse(savedStyles);
    
            for (let property in styleObject) {
                element.style[property] = styleObject[property];
            }
        } else {
            console.log(`No saved styles for note with ID ${noteId}`);
        }
    }
}

loadNotes();
loadSavedStyles();
