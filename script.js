var a = 100;
var currentplayer = 1;
var bluescore=0;
var redscore=0;
let timer = { 1 : 300,2 : 300};
let interval1,interval2;
let timeperturn = 30;
var unlockedring = 2;
var remainingtitans = {1 : 4,2 : 4};
var ownedtitans = {1 : 4,2 : 4};
let gameover = false;
let pausegame = false;
var phase = "placement";
let flag1=true;
let weight = Array.from({ length: 3 }, () => Array(6).fill(0));
let points = [];
let gamestates = [];
let noofundo = -1;
let history = [];
window.circle = [];
for(let i=0;i<3;i++){
    window.circle.push([]);
}
let neighbouringcircles = Array.from({ length: 3 }, () => Array(6).fill(null));
let selectedcircle = null;
document.addEventListener("DOMContentLoaded", () => {
    const svg = document.querySelector("svg"); 
    createhexpoints(a, svg);
    createpath(points,svg);
    for(let j=0;j<3;j++)
        for(let i=0;i<6;i++)
           createcircle(points[j][i],svg,i,j);
    
    setwieght(svg);
    findneighbouringcircle();
    console.log(neighbouringcircles);
    console.log(window.circle);
    starttime();
    gamestates.push(snapshotCircles());
    noofundo++;
    document.getElementById("pause").addEventListener("click",() => {
        if(!pausegame){
        clearInterval(interval1);
        clearInterval(interval1);
        pausegame = true;
        const popup =document.getElementById("result");
        popup.style.display = "flex";
        popup.style.background = "green"
        popup.innerHTML="GAME PAUSED!"
        document.getElementById("pauseid").setAttribute("src","play-buttton.png");
        }
        else{
            interval1 = setInterval(()=>decreamenttime(),1000);
        interval2 = setInterval(()=>checktimeout(),1000);
        pausegame = false;
        const popup =document.getElementById("result");
        popup.style.display = "none";
        document.getElementById("pauseid").setAttribute("src","pause.png");
        }
        document.getElementById("clicksound").play();
    });
    document.getElementById("reset").addEventListener("click",() => {
        document.getElementById("clicksound").play();
        setTimeout(location.reload(),1000);
    })
    document.getElementById("undo").addEventListener("click",() => {
        document.getElementById("clicksound").play();
        undo();
    })
    document.getElementById("redo").addEventListener("click",() => {
        document.getElementById("clicksound").play();
        redo();
    })
});
function createhexpoints(a, svg) {
    for (let j = 0; j < 3; j++) {
        let hexpoints = [];
        const radius = a + a * j;
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i;
            const x =radius*Math.cos(angle);
            const y =radius*Math.sin(angle);
            let p = [x, y];
            hexpoints.push(p);
        }
        points.push(hexpoints);
        createpolygon(hexpoints, svg); 
    }
    return;
}

function createpolygon(hexpoints, svg) {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const pointsString = hexpoints.map(p => p.join(',')).join(' ');
    polygon.setAttribute("points", pointsString);
    polygon.setAttribute("stroke", "white");
    polygon.setAttribute("stroke-width", "3");
    polygon.setAttribute("fill", "none");
    svg.appendChild(polygon); 
    return;
}
function createcircle(p, svg,i,j) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", `${p[0]}`);
    circle.setAttribute("cy", `${p[1]}`);
    circle.setAttribute("r", 10);
    circle.setAttribute("stroke", "white");
    circle.setAttribute("stroke-width", "3");
    circle.setAttribute("fill", "grey");
    circle.setAttribute("class","circle");
    circle.setAttribute("style", "cursor: pointer;");
    circle.dataset.player='0';
    circle.dataset.index= `${j}-${i}`;
    window.circle[j][i] = circle;
    circle.addEventListener("click",() => {
        if(pausegame) {
            erroraudio();
            return;
        }   
        if(phase !== "placement" )  return;
        if(circle.dataset.player !== '0')  {
            erroraudio();
            return ;
        }
        let check=false;
        for( let x of window.circle[unlockedring]){
            if(x === circle)
            {
                check = true;
            }
        }
        if(!check) {
            erroraudio();
            return;
        } 
        console.log("circle clicked in placement phase");
        if(remainingtitans[currentplayer] > 0){
            circle.setAttribute("fill", currentplayer === 1 ? "blue" : "red");
            circle.setAttribute("stroke", currentplayer === 1 ? "cornflowerblue" : "crimson");
            circle.dataset.player = currentplayer.toString();
            remainingtitans[currentplayer]--;
            currentplayer = 3 - currentplayer ;
            gamestates = gamestates.slice(0,noofundo+1);
            gamestates.push(snapshotCircles());
            noofundo++;
            setcolor();
            innerringunlocked();
            scorecalculation();
            selectaudio();
            if(remainingtitans[1] == 0 && remainingtitans[2] == 0 )
            {
                phase="movement";
            }
            starttime();
        }
    });
    circle.addEventListener("click", () => {
        if(pausegame || gameover) {
            erroraudio();
            return;
        }   
        if (phase != "movement" ) return;
        console.log("clicked in movement phase");
        let check=false;
        let unlockedcircles =[];
        for(let i = unlockedring; i < 3; i++) {
            for(let circle of window.circle[i]) {
            unlockedcircles.push(circle);
            }
        }
        for( let x of unlockedcircles){
            if(x === circle)
            {
                check = true;
            }
        }
        if(!check)  {
            console.log("innerring not unlocked");
            erroraudio();
            return ;
        }
        
        if (selectedcircle == null) {
            if (circle.dataset.player != currentplayer.toString() ) return;
            selectedcircle = circle;
            circle.setAttribute("stroke", "yellow");
            circle.setAttribute("fill", "green");
            circle.setAttribute("stroke-width", "4");
            console.log(selectedcircle);
            console.log("Titan selected:", circle.dataset.index);
            selectaudio();
            return;
        }
        if (circle === selectedcircle) {
            circle.setAttribute("stroke", "white");
            circle.setAttribute("stroke-width", "3");
            circle.setAttribute("fill", currentplayer === 1 ? "blue" : "red");
            circle.setAttribute("stroke", currentplayer === 1 ? "cornflowerblue" : "crimson");
            selectedcircle = null;
            console.log("Deselected titan");
            selectaudio()
            return;
        }
        if(circle.dataset.player == currentplayer.toString()){
            selectedcircle.setAttribute("stroke-width", "3");
            selectedcircle.setAttribute("fill",currentplayer == 1 ? "blue" : "red");
            selectedcircle.setAttribute("stroke", currentplayer === 1 ? "cornflowerblue" : "crimson");
            selectedcircle = circle;
            selectedcircle.setAttribute("stroke", "yellow");
            selectedcircle.setAttribute("fill","green");
            selectedcircle.setAttribute("stroke-width", "4");1
            console.log("Titan Reselcted :",circle.dataset.index);
            selectaudio();
            return ;
        }
        if (circle.dataset.player !== '0') {
            console.log("Target not empty");
            erroraudio();
            return;
        }
        const [si, sj] = selectedcircle.dataset.index.split('-').map(Number);
        let isNeighbour = false;
        const neighbour = neighbouringcircles[si][sj];
        for(let x of neighbour){
            if(x.circle === circle ){
                isNeighbour = true;
                break;
            }
        }
        if (!isNeighbour) {
            console.log("Not a valid move — not a neighbour");
            erroraudio();
            return;
        }
        
        circle.setAttribute("fill", currentplayer === 1 ? "blue" : "red");
        circle.setAttribute("stroke", currentplayer === 1 ? "cornflowerblue" : "crimson");
        circle.dataset.player = currentplayer;
        selectedcircle.setAttribute("fill", "grey");
        selectedcircle.setAttribute("stroke","white");
        selectedcircle.dataset.player = '0';
        console.log(`Moved from ${selectedcircle.dataset.index} to ${circle.dataset.index}`);
        selectedcircle = null;
        currentplayer = 3 - currentplayer;
        gamestates = gamestates.slice(0,noofundo+1);
        gamestates.push(snapshotCircles());
        noofundo++;
        setcolor();
        innerringunlocked();
        eliminatetitan();
        scorecalculation();
        decidewinner();
        jumpaudio();
        starttime();
        
    });
    svg.appendChild(circle);
    return;
}
function createpath(points, svg) {
    for (let i = 0; i < 6; i++) {
        let j=1,k=0;
        if (i % 2){
            j=2;
        }
        if(i%3==0){
            k=20;
        }
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const startX = points[j][i][0];
        const startY = points[j][i][1];
        const endX = points[j-1][i][0];
        const endY = points[j-1][i][1];
        const midX = (startX + endX) / 2+20-k;
        const midY = (startY + endY) / 2+k;
        const text=createtext(midX,midY);
        text.textContent = '1';
        svg.appendChild(text);
        const d = `M ${startX} ${startY} L ${endX} ${endY}`;
        path.setAttribute("d", d);
        path.setAttribute("stroke", "white");
        path.setAttribute("stroke-width", "3");
        path.setAttribute("fill", "none");
        svg.appendChild(path);
    }
}
function createtext(x,y){
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("fill", "rgb(231, 116, 15)");
    text.setAttribute("font-size", "28");
    text.setAttribute("text-anchor", "middle");
    return text;
}
function setwieght(svg){
    let s=100;
    for(let i=0;i<6;i++){
        const angle=Math.PI/6*(2*i+1);
        for(let j=3;j>0;j--){
            const text=createtext((s+15)*Math.cos(angle),(s+15)*Math.sin(angle));
            const upper=3*(j),lower=3*(j-1)+1;            
            const temp = Math.floor(Math.random() * (upper - lower + 1)) + lower;
            weight[3-j][i] = temp;
            text.textContent=`${temp}`;
            svg.appendChild(text);
            s+=100;
        }
        s=100;
    }
}
console.log(weight);
function innerringunlocked(){
    let outerringcircle =window.circle[unlockedring];
    let filled = true;
    for( let x of outerringcircle){
        if(x.dataset.player == '0'){
            filled = false;
            break;
        }
    }
    if(filled){
        unlockedring--;
    }
    return ;
}
function findneighbouringcircle() {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 6; j++) {
            let tempcircles = [];
            
            if (j > 0) tempcircles.push({
                circle : window.circle[i][j - 1],
                weight : weight[i][j-1]
            });
            else tempcircles.push({
                circle : window.circle[i][5],
                weight : weight[i][5]
            });
            if (j < 5) tempcircles.push({
                circle : window.circle[i][j + 1],
                weight : weight[i][j]
            });
            else tempcircles.push({
                circle : window.circle[i][0],
                weight : weight[i][5]
            });
            if(i==0){
                if(j%2 == 0)
                tempcircles.push({
                    circle : window.circle[1][j],
                    weight : 1
                });
            }
            else if(i==1){
                if(j%2 == 0)
                 tempcircles.push({
                    circle : window.circle[0][j],
                    weight : 1
                });
                else
                tempcircles.push({
                    circle : window.circle[2][j],
                    weight : 1
                });
            }
            else {
                if(j%2 ==1 )
                 tempcircles.push({
                    circle : window.circle[1][j],
                    weight : 1
                });
            }
            neighbouringcircles[i][j] = tempcircles;
        }
    }
}
function eliminatetitan(){
    let eliminated = false;
    for(let i=0;i<3;i++){
        for(let j=0;j<6;j++){
            let temptitan = window.circle[i][j];
            if(temptitan.dataset.player != currentplayer.toString())  continue;
            const neighbour = neighbouringcircles[i][j];
            let surrounded = true;
            for(x of neighbour){
                const temp = x.circle.dataset.player;
                if( temp == temptitan.dataset.player || temp == '0')
                {
                    surrounded = false;
                    break;
                }
            }
            if(surrounded){
                temptitan.dataset.player = '0';
                temptitan.setAttribute("fill","grey");
                temptitan.setAttribute("stroke", "white");
                eliminated = true;
                ownedtitans[currentplayer]--;
                decidewinner();
            }
        }
    }
    if(eliminated){
        setTimeout(killaudio,500);
    }
}
function scorecalculation(){
    bluescore = 0;
    redscore = 0;
    for(let i=0;i<3;i++){
        for(let j=0;j<6;j++){
            let temptitan = window.circle[i][j];
            if(temptitan.dataset.player == '0')   continue;
            const neighbour = neighbouringcircles[i][j];
            for( let x of neighbour){
                const temp = x.circle.dataset.player;
                const tempweight = x.weight;
                if(temp == temptitan.dataset.player){
                    if(temptitan.dataset.player == '1'){
                        bluescore += tempweight;
                    }
                    else
                       redscore += tempweight
                }
            }
        }
    }
    redscore/=2;
    bluescore/=2;
    document.getElementById("bluescore").innerHTML=`${bluescore}`;
    document.getElementById("redscore").innerHTML=`${redscore}`;

}
function decreamenttime(){
    if(timer[currentplayer] > 0 && timeperturn > 0)
    {
        timer[currentplayer]--;
        timeperturn--;
    }
    let redmin = Math.floor(timer[2] / 60).toString().padStart(2, '0');
    let redsec = (timer[2] % 60).toString().padStart(2, '0');
    let bluemin = Math.floor(timer[1] / 60).toString().padStart(2, '0');
    let bluesec = (timer[1] % 60).toString().padStart(2, '0');
    document.getElementById("bluetime").innerHTML=`${bluemin}: ${bluesec}`;
    document.getElementById("redtime").innerHTML=`${redmin}: ${redsec}`;
    document.getElementById("timeremain").innerHTML=`${timeperturn}s`;
    if(timer[currentplayer] <= 0){
        clearInterval(interval1);
        clearInterval(interval2)
        decidewinner();
    }
}
function decidewinner(){
    if(timer[1] == 0){
        const winner =document.getElementById("result");
        winner.style.display = "flex";
        winner.style.background = "crimson"
        winner.innerHTML="RED WINS!";
        clearInterval(interval1);
        clearInterval(interval2);
        gameover = true;
    }
   
    else if(ownedtitans[2] == 1){
        const winner =document.getElementById("result");
        winner.style.display = "flex";
        winner.style.background = "cornflowerblue"
        winner.innerHTML="BLUE WINS!";
        clearInterval(interval1);
        clearInterval(interval2);
        gameover = true;
    }
    else if(checkinnermostringfilled()){
        if(redscore > bluescore){
            const winner =document.getElementById("result");
        winner.style.display = "flex";
        winner.style.background = "crimson"
        winner.innerHTML="RED WINS!";
        clearInterval(interval1);
        clearInterval(interval2);
        gameover = true;
        }
        else if(bluescore > redscore)
        {
            const winner =document.getElementById("result");
            winner.style.display = "flex";
            winner.style.background = "cornflowerblue"
            winner.innerHTML="BLUE WINS!";
            clearInterval(interval1);
            clearInterval(interval2);
            gameover = true;
        }
        else
        {
            const winner =document.getElementById("result");
            winner.style.display = "flex";
            winner.innerHTML="MATCH TIED!";
            clearInterval(interval1);
            clearInterval(interval2);
            gameover = true;
        }
    }
    else if(timer[2] == 0){
        const winner =document.getElementById("result");
        winner.style.display = "flex";
        winner.style.background = "cornflowerblue"
        winner.innerHTML="BLUE WINS!";
        clearInterval(interval1);
        clearInterval(interval2);
        gameover = true;
    }
    else if(ownedtitans[1] == 1){
        const winner = document.getElementById("result");
        winner.style.display = "flex";
        winner.style.background = "crimson"
        winner.innerHTML="RED WINS!";
        clearInterval(interval1);
        clearInterval(interval2);
        gameover = true;
    }
    if(gameover){
        winaudio();
    }
}
function checkinnermostringfilled(){
    const innermostcircles = window.circle[0];
    for(let x of innermostcircles){
        let circleholder =x.dataset.player;
        if(circleholder == '0'){
            console.log(" Innermost Ring Not filled");
            return false;
        }
    }
    return true;
}
function starttime(){
    if(gameover)   return;
    clearInterval(interval1);
    clearInterval(interval2);
    timeperturn = 30;
    interval1 = setInterval(()=>decreamenttime(),1000);
    interval2 = setInterval(()=>checktimeout(),1000);
}
function checktimeout(){
    if(gameover )   return;
    if(timeperturn <= 0){
        clearInterval(interval1);
        clearInterval(interval2);
        if(selectedcircle != null)
        {
            selectedcircle.setAttribute("fill",currentplayer == 1? "blue" : "red");
            selectedcircle.setAttribute("stroke",currentplayer == 1? "cornflowerblue" : "crimson");
            selectedcircle = null;
        }
        currentplayer = 3 - currentplayer;
        setcolor();
        starttime();
    }
}
function setcolor(){
    const playercard = document.getElementsByClassName("playercard")[0];
    const dataincard = playercard.querySelectorAll(".child");
    if(currentplayer == 1){
        playercard.style.backgroundColor = "cornflowerblue";
        dataincard.forEach(child =>{
            child.style.backgroundColor = "cornflowerblue";
        });
        dataincard[0].innerHTML = "BLUE";
    }
    else{
        playercard.style.backgroundColor = "crimson";
        dataincard.forEach(child =>{
            child.style.backgroundColor = "crimson";
        });
        dataincard[0].innerHTML = "RED";
    }
}
function selectaudio(){
    const selectsound = document.getElementById("selectsound");
    selectsound.play();
}
function jumpaudio(){
    const jumpsound= document.getElementById("jumpsound");
    jumpsound.play();
}
function erroraudio(){
    const errorsound = document.getElementById("errorsound");
    errorsound.play();
}
function winaudio(){
    const winsound = document.getElementById("winsound");
    winsound.play();
}
function killaudio(){
    const killsound = document.getElementById("killsound");
    killsound.play();
}
function snapshotCircles() {
    let snapshot = [];
    for (let i = 0; i < 3; i++) {
        snapshot.push([]);
        for (let j = 0; j < 6; j++) {
            let c = window.circle[i][j];
            snapshot[i].push({
                stroke: c.getAttribute("stroke"),
                fill: c.getAttribute("fill"),
                strokewidth: c.getAttribute("stroke-width"),
                player: c.dataset.player
            });
        }
    }
    return snapshot;
}
function undo() {
    if(noofundo > 0){
        noofundo--;
        changegamestate();
    }
}
function redo(){
    const temp = gamestates.length;
    if(noofundo < temp - 1){
        noofundo++;
        changegamestate();
    }
}
function changegamestate(){
    let tempcircles = gamestates[noofundo];
        for(let i =0;i< 3;i++){
            for(let j = 0; j< 6;j++){
                const stroke = tempcircles[i][j].stroke;
                const fill = tempcircles[i][j].fill;
                const strokewidth = tempcircles[i][j].strokewidth;
                window.circle[i][j].setAttribute("stroke",stroke);
                window.circle[i][j].setAttribute("stroke-width",strokewidth);
                window.circle[i][j].setAttribute("fill",fill);
                window.circle[i][j].dataset.player = tempcircles[i][j].player;
            }
        }
}