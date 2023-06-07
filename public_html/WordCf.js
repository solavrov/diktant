export { WordCf };

class WordCf {
    
    constructor(arr, ref) {
        if (arr.length * ref.length === 0) {
            throw "WordCf: empty array error";
        }
        this.blank = "";
        this.arr = arr.slice(); //array of inputs
        this.ref = ref.slice(); //reference array
        this.mat = null;
        this.path = null;
        this.err = null;
        this.rt = null;
        this.ser = null;
    }
    
    static equal(x, y) {
        if (x === undefined || y === undefined) {
		return false;
	} else {
	        return x[0] === y[0] && x[1] === y[1];
	}
    }

    static minus(x, y) {
        return [x[0] - y[0], x[1] - y[1]];
    }

    static plus(x, y) {
        return [x[0] + y[0], x[1] + y[1]];
    }
    
    static cross(x) {
        return "<del style='color:red'>" + x + "</del>";
    }

    static blue(x) {
        return "<span style='color:white; background-color:blue'>" + x + "</span>";
    }
    
    makeMat() {
        let mat = [];
        for (let i = 0; i < this.arr.length; i++) {
            let row = new Array(this.ref.length).fill(0);
            mat.push(row);
        }
        for (let j = 0; j < this.arr.length; j++) {
            for (let i = 0; i < this.ref.length; i++) {
                if (this.arr[j] === this.ref[i]) {
                    mat[j][i] = 1;
                }
            }
        }
        return mat;
    }
    
    findTarget(pos, way) {
        if (WordCf.equal(pos, [-1, -1]) &&  way.slice(-2) === "01") return [-1, 0];
        if (WordCf.equal(pos, [-1, -1]) &&  way.slice(-2) === "10") return [0, -1];
        
        way = way.slice(0, -2);
        
        function sum(x, y, max) {
            const z = x + y;
            if (z < max) {
                return z;
            } else {
                return max;
            }
        }
        
        const j0 = pos[0];
        const i0 = pos[1];
        const i1 = this.ref.length - 1;
        const j1 = this.arr.length - 1;
        
        function corner(j, i) {
            return (j === j1) && (i === i1);
        }
        
        let i, j;
        let k = 0;
        let found = false;
        while (!found) {
            k++;
            if (way === "del") j = sum(j0, k, j1); else i = sum(i0, k, i1);
            for (let l = 1; l <= k; l++) {
                if (way === "del") i = sum(i0, l, i1); else j = sum(j0, l, j1);
                if (this.mat[j][i] === 1 || corner(j, i)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                for (let l = k - 1; l >= 1; l--) {
                    if (way === "del") j = sum(j0, l, j1); else i = sum(i0, l, i1);
                    if (this.mat[j][i] === 1) {
                        found = true;
                        break;
                    }
                }
            }
        }
        return [j, i];
    }
    
    step(pos, tar) {
        let m = WordCf.minus(tar, pos);
        let moves = [];
        if (m[0] * m[1] > 0 && this.mat[tar[0]][tar[1]] === 1) {
            m = WordCf.minus(m, [1, 1]);
            moves.unshift([1, 1]);
        }
        for (let k = 0; k < m[1]; k++) {
            moves.unshift([0, 1]);
        }
        for (let k = 0; k < m[0]; k++) {
            moves.unshift([1, 0]);
        }
        return moves;
    }
    
    pathForWay(way) {
        let path = [];
        let pos = [-1, -1];
        let tar = this.findTarget(pos, way);
        let moves = this.step(pos, tar);
        while (moves.length !== 0) {
            path = path.concat(moves);
            pos = tar;
            tar = this.findTarget(pos, way);
            moves = this.step(pos, tar);
        }
        return path;
    }
    
    static pathStat(path) {        
       let countErr = 0;
       let count10 = 0;
       let count01 = 0;
       let countSer = 0;
       let countSer2 = 0;
       let countRt = 0;
       for (const move of path) {
           if (WordCf.equal(move, [1, 1])) {
                countRt++;
                countSer2++;
                countErr += Math.min(count10, count01) + Math.abs(count10 - count01);
                count10 = count01 = 0;
           } else {
                countSer = Math.max(countSer, countSer2);
                countSer2 = 0;
                if (WordCf.equal(move, [1, 0])) {
                    count10++;
                } else {               
                    count01++;
                }
           }
       }
       countErr += Math.min(count10, count01) + Math.abs(count10 - count01);
       countSer = Math.max(countSer, countSer2);
       return {err: countErr, rt: countRt, ser: countSer};
    }
    
    makePath() {
        
        function choose(p1, p2) {
            if (p1.err < p2.err) {
                return p1;
            } else if (p1.err > p2.err) {
                return p2;
            } else {
                if (p1.ser > p2.ser) {
                    return p1;
                } else if (p1.ser < p2.ser) {
                    return p2;
                } else {
                    return p1;
                }
            }
        }
        
        const names = ["delXX", "insXX", "del10", "ins10", "del01", "ins01"];
        let pathes = [];
        for (const name of names) {
            let p = this.pathForWay(name);
            pathes.push({path: p, err: WordCf.pathStat(p).err, ser: WordCf.pathStat(p).ser});
        }
        let choice = pathes[0];
        for (let i = 1; i < names.length; i++) {
            choice = choose(choice, pathes[i]);
        }
        return choice.path;
    }
    
    cf() {        
        let cf = {arr: [], ref: []};
        let pos = [-1, -1];
        for (const move of this.path) {
            pos = WordCf.plus(pos, move);
            if (move[0] === 0) {
                cf.ref.push(this.ref[pos[1]]);
                cf.arr.push(this.blank);
            } else if (move[1] === 0) {
                cf.arr.push(this.arr[pos[0]]);
                cf.ref.push(this.blank);
            } else {
                cf.arr.push(this.arr[pos[0]]);
                cf.ref.push(this.ref[pos[1]]);
            }
        }
        return cf;
    }        
    
    html() {
        const cf = this.cf();
        let html = "";
        for (let i = 0; i < cf.arr.length; i++) {
            if (cf.arr[i] === this.blank) {
                html += WordCf.blue(cf.ref[i]);
            } else if (cf.ref[i] === this.blank) {
                html += WordCf.cross(cf.arr[i]);
            } else {
                html += cf.arr[i];
            }
        }
        return html;
    }
    
    
    // возвращает индексы ref неправильных букв (это могут быть пропущенные буквы)
    // дробный индекс указывает на одну лишнюю букву между индексами ref
    errInfo() {        
        let info = [];
        let pos = [-1, -1];
        for (let i = 0; i < this.path.length; i++) {
            pos = WordCf.plus(pos, this.path[i]);
            if (WordCf.equal(this.path[i], [0, 1])) info.push(pos[1]);
            if (i > 0 && 
                i < this.path.length - 1 && 
                WordCf.equal(this.path[i], [1, 0]) &&
                WordCf.equal(this.path[i - 1], [1, 1]) &&
                WordCf.equal(this.path[i + 1], [1, 1])
                ) {
                info.push(pos[1] + 0.5);
            }
        }
        return info;
    }
    
    run() {
        this.mat = this.makeMat();
        this.path = this.makePath();
        const stat = WordCf.pathStat(this.path);
        this.err = stat.err;
        this.rt = stat.rt;
        this.ser = stat.ser;
    }
    
}

