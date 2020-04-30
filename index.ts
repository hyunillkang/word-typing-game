import {
  of,
  interval,
  combineLatest,
  BehaviorSubject,
  Subject,
  fromEvent,
  forkJoin
} from "rxjs";
import {
  map,
  switchMap,
  tap,
  filter,
  scan,
  startWith,
  takeWhile
} from "rxjs/operators";

//html elements
const gamePanel = document.getElementById("gamePanel");
const inputField = document.getElementById("inputField");
const showValue = document.getElementById("showValue");
const levelLabel = document.getElementById("levelLabel");
const matchedWordsLabel = document.getElementById("matchedWordsLabel");

const endThreshhold = 20;

const intervalValue = 1000;
const nextLevelThreshold = 5;

let numOfMathcedWords = 0;

let level = 0;

let interval$ = new BehaviorSubject(1000);
let inputEvent$;
let word$ = new Subject();

function onInit() {
  console.clear();
  inputEvent();
  onGameStart();
}

function inputEvent() {
  inputEvent$ = fromEvent(inputField, "change").pipe(
    startWith({ target: { value: "" } }),
    map(event => event.target.value),
    tap(value => {
      inputField.value = "";
    })
  );
}

function onGameStart() {
  interval$.pipe(switchMap(number => interval(number))).subscribe(() => {
    word$.next(createRandomWord(Math.floor(Math.random() * 5)));
  });

  displayWords();
}

function createRandomWord(wordLength) {
  const key = "abcdefghijklmnopqrstuvwxyz";
  let randomWord = "";

  for (let i = 1; i <= wordLength; i++) {
    randomWord += key[Math.floor(Math.random() * key.length)];
  }

  let xPos = parseInt(Math.random() * 30 + "");

  return randomWord !== "" ? { value: randomWord, xPos } : null;
}

function displayWords() {
  gamePanel.innerHTML = "";

  let words$ = word$.pipe(scan((words, word) => [word, ...words], []));

  combineLatest(words$, inputEvent$)
    .pipe(
      switchMap(([words, value]) => {
        words.forEach(function(word, index) {
          if (word && (word.value === value || word.value === "")) {
            words.splice(index, 1, null);
            if (word.value === value) {
              numOfMathcedWords++;
              matchedWordsLabel.innerText = numOfMathcedWords;

              if (numOfMathcedWords % nextLevelThreshold === 0) {
                level++;
                levelLabel.innerText = level + 1;

                interval$.next(intervalValue - level * 50);
              }
            }
            return;
          }
        });

        if (!words[words.length - 1]) {
          words.splice(words.length - 1, 1);
        }

        return of({ words: words, value: value });
      }),
      takeWhile(({ words, value }) => words.length < endThreshhold)
    )
    .subscribe(
      ({ words, value }) => {
        let displayWords = "";

        words.forEach(function(word) {
          displayWords += word
            ? "&nbsp;".repeat(word.xPos) + word.value + "<br/>"
            : "<br/>";
        });

        gamePanel.innerHTML = displayWords;
      },
      () => {},
      () => {
        alert("game over!");
      }
    );
}

onInit();
