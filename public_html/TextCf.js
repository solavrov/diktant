export { TextCf };

import { WordCf } from "./WordCf.js";

class TextCf extends WordCf {
    
    constructor (text, ref) {
        super(TextCf.parse(text), TextCf.parse(ref));
        this.errRatio = 0.5;
        this.matCf = this.makeMatCf();
        this.run();
    }
    
    static mark(char, dash=true) {
        return char === "." || char === "," || char === "!" || char === "?" || 
                char === ":" || (char === "-" && dash);
    }
    
    static space(char) {
        return char === " " || char === "\t";
    }
    
    static VOID = "[_]";
    
    static parse(text) {
        let arr = [];
        if (text === "") {
            arr.push(TextCf.VOID);
        } else {   
            let word = "";
            for (let char of text) {
                if (!TextCf.mark(char, false) && !TextCf.space(char)) {
                    if (char === "ё") char = "е";
                    word = word.concat(char);
                } else {
                    if (word !== "") {
                        arr.push(word);
                        word = "";
                    }
                    if (TextCf.mark(char, false)) arr.push(char);
                }
            }
            if (word !== "") arr.push(word);
        }
        return arr;
    }
    
    makeMatCf() {
        let matCf = [];
        for (let i = 0; i < this.arr.length; i++) {
            let row = new Array(this.ref.length).fill(0);
            matCf.push(row);
        }
        for (let j = 0; j < this.arr.length; j++) {
            for (let i = 0; i < this.ref.length; i++) {
                let c = new WordCf(this.arr[j], this.ref[i]);
                c.run();
                matCf[j][i] = c;
            }
        }
        return matCf;
    }
    
    makeMat() {
        let mat = [];
        for (let i = 0; i < this.arr.length; i++) {
            let row = new Array(this.ref.length).fill(0);
            mat.push(row);
        }
        for (let j = 0; j < this.arr.length; j++) {
            for (let i = 0; i < this.ref.length; i++) {
                const len = Math.max(this.arr[j].length, this.ref[i].length);
                mat[j][i] = 1 * (this.matCf[j][i].err / len <= this.errRatio);
            }
        }
        return mat;
    }
        
    stat() {        
        let stat = {wordWrong: 0, wordMiss: 0, wordWaste: 0, markMiss: 0, markWaste: 0};
        let pos = [-1, -1];
        for (let i = 0; i < this.path.length; i++) {
            const move = this.path[i];
            pos = WordCf.plus(pos, move);
            if (move[0] === 0) {
                if (TextCf.mark(this.ref[pos[1]])) {
                    stat.markMiss++;
                } else {
                    let isJointErr = 0;
                    if (WordCf.equal(this.path[i + 1], [1, 1])) {
                        const cf = new WordCf(this.arr[pos[0] + 1], this.ref[pos[1]] + this.ref[pos[1] + 1]);
                        cf.run();
                        if (cf.err < this.matCf[pos[0] + 1][pos[1] + 1].err) isJointErr++;
                    }
                    if (WordCf.equal(this.path[i - 1], [1, 1])) {
                        const cf = new WordCf(this.arr[pos[0]], this.ref[pos[1] - 1] + this.ref[pos[1]]);
                        cf.run();
                        if (cf.err < this.matCf[pos[0]][pos[1] - 1].err) isJointErr++;
                    }
                    if (isJointErr === 0) stat.wordMiss++;
                }
            } else if (move[1] === 0) {
                if (TextCf.mark(this.arr[pos[0]])) {
                    stat.markWaste++;
                } else {
                    let isSeparateErr = 0;
                    if (WordCf.equal(this.path[i + 1], [1, 1])) {
                        const cf = new WordCf(this.arr[pos[0]] + this.arr[pos[0] + 1], this.ref[pos[1] + 1]);
                        cf.run();
                        if (cf.err < this.matCf[pos[0] + 1][pos[1] + 1].err) isSeparateErr++;
                    }
                    if (WordCf.equal(this.path[i - 1], [1, 1])) {
                        const cf = new WordCf(this.arr[pos[0] - 1] + this.arr[pos[0]], this.ref[pos[1]]);
                        cf.run();
                        if (cf.err < this.matCf[pos[0] - 1][pos[1]].err) isSeparateErr++;
                    }
                    if (isSeparateErr === 0) stat.wordWaste++;

                }
            } else {
                stat.wordWrong += 1 * (this.matCf[pos[0]][pos[1]].err > 0);
            }
        }
        if (this.arr[0] === TextCf.VOID) stat.wordWaste--;
        return stat;
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
    
    wcf() {
        let wcf = [];
        let pos = [-1, -1];
        for (const move of this.path) {
            pos = WordCf.plus(pos, move);
            if (move[0] === 0) {
                wcf.push(null);
            } else if (move[1] === 0) {
                wcf.push(null);
            } else {
                wcf.push(this.matCf[pos[0]][pos[1]]);
            }
        }
        return wcf;
    }
     
    html(rules=[]) {
        
        function rule(i) {
            if (rules.length > 0) {
                return rules[i];
            } else {
                return "";
            }
        }
        
        const cf = this.cf();
        const wcf = this.wcf();
        let html = "";
        let start = 0;
        if (cf.arr[0] === TextCf.VOID) start++;
        for (let i = start; i < cf.arr.length; i++) {
            if (cf.arr[i] === this.blank) {
                html += (WordCf.blue(cf.ref[i]) + rule(i) + " ");
            } else if (cf.ref[i] === this.blank) {
                html += (WordCf.cross(cf.arr[i]) + rule(i) + " ");
            } else {
                if (TextCf.mark(cf.ref[i])) html = html.slice(0, -1);
                html += (wcf[i].html() + rule(i) + " ");
            }
        }
        return html;
    }
    
    // указывает в индексах cf пропущеные слова (например, из-за написания слитно) и слова с ошибками
    // для слов с ошибками дает WordCf
    errInfo() {        
        let info = [];
        let pos = [-1, -1];
        for (const move of this.path) {
            pos = WordCf.plus(pos, move);
            if (WordCf.equal(move, [0, 1])) {
                info.push({ iRef: pos[1], wcf: null });
            } else if (WordCf.equal(move, [1, 1]) && this.matCf[pos[0]][pos[1]].err > 0) {
                info.push({ iRef: pos[1], wcf: this.matCf[pos[0]][pos[1]] });
            } else {
                info.push(null);
            }
        }
        return info;
    }
       
}

