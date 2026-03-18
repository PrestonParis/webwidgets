window.addEventListener("load", startGame)

const turn = "x"
const turn_no = 0

const one = document.querySelector(`div div button.one`)?.innerHTML
const two = document.querySelector(`div div button.two`)?.innerHTML
const three = document.querySelector(`div div button.three`)?.innerHTML
const four = document.querySelector(`div div button.four`)?.innerHTML
const five = document.querySelector(`div div button.five`)?.innerHTML
const six = document.querySelector(`div div button.six`)?.innerHTML
const seven = document.querySelector(`div div button.seven`)?.innerHTML
const eight = document.querySelector(`div div button.eight`)?.innerHTML
const nine = document.querySelector(`div div button.nine`)?.innerHTML

const squares = [
    document.querySelector(`div div button.one`), 
    document.querySelector(`div div button.two`), 
    document.querySelector(`div div button.three`), 
    document.querySelector(`div div button.four`), 
    document.querySelector(`div div button.five`), 
    document.querySelector(`div div button.six`), 
    document.querySelector(`div div button.seven`), 
    document.querySelector(`div div button.eight`), 
    document.querySelector(`div div button.nine`), 
]

const wins = [
    [one, two, three],
    [four, five, six],
    [seven, eight, nine],
    [one, four, seven],
    [two, five, eight],
    [three, six, nine],
    [one, five, nine],
    [three, five, seven]
]


function startGame() {
    document.getElementById("turn").innerHTML = `${turn.toUpperCase()} turn`
}

function placeLetter(element) {
    button = document.querySelector(`div div button.${element}`)
    button.innerHTML = turn
    turn_no += 1
    turn == "x" ? turn = "o": turn = "x"
    document.getElementById("turn").innerHTML = `${turn.toUpperCase()} turn`
    check_wins()
}

function check_wins() {
    const one = document.querySelector(`div div button.one`)?.innerHTML;
    const two = document.querySelector(`div div button.two`)?.innerHTML;
    const three = document.querySelector(`div div button.three`).innerHTML;
    const four = document.querySelector(`div div button.four`).innerHTML;
    const five = document.querySelector(`div div button.five`).innerHTML;
    const six = document.querySelector(`div div button.six`).innerHTML;
    const seven = document.querySelector(`div div button.seven`).innerHTML;
    const eight = document.querySelector(`div div button.eight`).innerHTML;
    const nine = document.querySelector(`div div button.nine`).innerHTML;

    const wins = [
        [one, two, three],
        [four, five, six],
        [seven, eight, nine],
        [one, four, seven],
        [two, five, eight],
        [three, six, nine],
        [one, five, nine],
        [three, five, seven]
    ];

    for (pattern of wins) {
        if (pattern.join("") == "xxx") {
            document.getElementById("result").innerHTML = ("X Wins!")
            document.getElementById("turn").style.display = "none"
            for (s of squares) {
                s.removeAttribute("onclick")
            }
        }

        else if (pattern.join("") == "ooo") {
            document.getElementById("result").innerHTML = ("O Wins!")
            document.getElementById("turn").style.display = "none"
            for (s of squares) {
                s.removeAttribute("onclick")
            }
        }

        else if (turn_no == 9) {
            document.getElementById("result").innerHTML = ("It was a Draw!")
            for (s of squares) {
                s.removeAttribute("onclick")
            }
        }
    }
}