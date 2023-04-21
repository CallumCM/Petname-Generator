async function fetchSlots() {
    const response = await fetch('/slots.json');
    const data = await response.json();
    return data;
}

let slots = await fetchSlots();

const FAILSAFE_SLOT_LENGTH = 1000;
// The amount of slots that actually get spun every spin
const SLOT_SPIN_SIZE = 30;
const SLOT_HEIGHT = 105
const SLOT_HEIGHT_PX = `${SLOT_HEIGHT}px`;
const SPIN_TIME = 1750;
const SPIN_TIME_MS = `${SPIN_TIME}ms`;
const MAX_SLOT_LENGTH = Math.max(...slots.map((slot) => slot.length));

// No idea why but odd-length slots get offset up half a slot
const SLOT_CONTAINER_HEIGHT = SLOT_HEIGHT * ~~(SLOT_SPIN_SIZE/2) - ((SLOT_SPIN_SIZE % 2 == 0) * (SLOT_HEIGHT/2));

Array.prototype.shuffle = function() {
    var i = this.length;
    while (i) {
        var j = Math.floor(Math.random() * i);
        var t = this[--i];
        this[i] = this[j];
        this[j] = t;
    }
    return this; //Callum is so cool
}

/**
 * Significantly faster than Array.unshift(val)
 * https://jsbench.me/x6lgkd5i6f/1
 */
Array.prototype.prepend = function(val) {
    return [val].concat(this);
}

function normalizeSlotLength() {
    let i;
    slots.forEach((slot) => {
        i = 0;
        while (slot.length < SLOT_SPIN_SIZE) {
            slot.push(slot[i]);
            i++;
            if (i >= FAILSAFE_SLOT_LENGTH)
                throw new Error(`Slot length is too long. Max length is ${FAILSAFE_SLOT_LENGTH}`);
        }
    });
}

function shuffleSlots() {
    let shuffled = slots.map((slot) => slot.shuffle());

    // Trim each slot subarray down to SLOT_SPIN_SIZE
    shuffled = shuffled.map((slot) => slot.slice(0, SLOT_SPIN_SIZE));

    return shuffled;
}

function pickWinningSlots() {
    const winningSlots = new Array(slots.length);

    for (let i = 0; i < slots.length; i++) {
        winningSlots[i] = createBox(slots[i][Math.floor(Math.random() * slots[i].length)]);
    }

    return winningSlots;
}

function createBox(text) {
    const box = document.createElement('div');
    box.className = 'box flex justify-center items-center text-center text-4xl';
    box.style.width = '100%';
    box.style.height = SLOT_HEIGHT_PX;
    box.textContent = text;
    return box;
}

function animateY(element, px) {
    element.style.transitionDuration = SPIN_TIME_MS;
    element.style.transform = `translateY(${px}px)`;
}

function setY(element, px) {
    element.style.transitionDuration = 0;
    element.style.transition = "none";
    element.style.transform = `translateY(${px}px)`;
    // apply the transition: none and transform rule immediately
    flushCss(element);
    // restore animation
    element.style.transition = "";
}

function flushCss(element) {
    // By reading the offsetHeight property, we are forcing
    // the browser to flush the pending CSS changes (which it
    // does to ensure the value obtained is accurate).
    element.offsetHeight;
}

let winningBoxes = new Array(slots.length);

function createSlotmachineDoors() {
    const doorContainer = document.getElementById('doors');
    let door, box, boxContainer, boxes;

    const shuffledSlots = shuffleSlots();

    for(let i = 0; i < slots.length; i++) {
        door = document.createElement('div');
        door.className = "flex justify-center items-center overflow-hidden rounded-md p-1 m-1 bg-rose-50 border-6 border-pink-500 max-w-xs grow h-28";
        door.id = `door-${i}`;
        doorContainer.appendChild(door);

        // Hidden template to make the spinner
        boxContainer = document.createElement('div');
        boxContainer.className = `boxcontainer flex flex-col transition-transform`;
        setY(boxContainer, -SLOT_CONTAINER_HEIGHT);
        door.appendChild(boxContainer);

        boxes = [];
        let box;
        for (let j = 0; j < shuffledSlots[i].length; j++) {
            box = createBox(shuffledSlots[i][j], j==0);
            boxes.push(box);
        }

        boxes.forEach(box => boxContainer.appendChild(box));

        winningBoxes[i] = boxes[0];
    }
}

function resetSlotmachineDoors() {
    // Get all the boxContainers
    const boxContainers = Array.from(document.querySelectorAll('.boxcontainer'));
    let boxes, boxContainer;

    // Remove all but the first box from each boxContainer
    boxContainers.forEach((boxContainer, i) => {
        boxes = Array.from(boxContainer.children);

        boxes.forEach(box => {
            boxContainer.removeChild(box);
        });
    });

    // Generate a new set of boxes
    const shuffledSlots = shuffleSlots();

    // Loop through each boxContainer
    for(let i = 0; i < boxContainers.length; i++) {
        boxContainer = boxContainers[i];
        boxes = [];
        let box;
        for (let j = 0; j < shuffledSlots[i].length; j++) {
            box = createBox(shuffledSlots[i][j], j==0);
            boxes.push(box);
        }

        // Remove a box from the set, since the box from the previous spin will be added
        boxes.pop();

        // Add the winning box to the end as well
        boxes.push(winningBoxes[i]);

        // Add the new set of boxes to the boxContainer
        boxes.forEach(box => boxContainer.appendChild(box));

        winningBoxes[i] = boxes[0];

        // Set the boxContainer's Y to -SLOT_CONTAINER_HEIGHT
        setY(boxContainer, -SLOT_CONTAINER_HEIGHT);
    }
}

let isSpinning = false;
let hasSpun = false;

function spin() {
    if (isSpinning) {
        return;
    }

    if (hasSpun) {
        resetSlotmachineDoors();
    } else {
        hasSpun = true;
    }

    isSpinning = true;

    const boxContainers = Array.from(document.querySelectorAll('.boxcontainer'));
    boxContainers.forEach(boxContainer => {
        setY(boxContainer, -SLOT_CONTAINER_HEIGHT);
        animateY(boxContainer, SLOT_CONTAINER_HEIGHT);
        
        boxContainer.addEventListener(
            'transitionstart',
            function() {
                this.querySelectorAll('.box').forEach((box) => {
                    setTimeout(() => { box.style.filter = 'blur(1.25px)' }, SPIN_TIME * 0.1)
                    setTimeout(() => { box.style.filter = '' }, SPIN_TIME * 0.9)
                });
            },
            { once: true }
        );
        boxContainer.addEventListener(
            'transitionend',
            function() {
                isSpinning = false;
            },
            { once: true }
        );
    });
}

normalizeSlotLength();

createSlotmachineDoors();
document.getElementById('spin-slotmachine-button').addEventListener('click', spin);