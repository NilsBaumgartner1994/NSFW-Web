import React from 'react';

import './variationPicklist.css';

const similarity = require( 'compute-cosine-similarity' );

export class ExamOptimizer {

    constructor(orderedExamtasks,examtasksTaskvariations,savedVariations=[]) {
        this.setOrderedExamTasks(orderedExamtasks);
        this.setExamtasksTaskvariations(examtasksTaskvariations);
        this.setSavedVariations(savedVariations);
    }

    setOrderedExamTasks(orderedExamtasks){
        this.orderedExamtasks = orderedExamtasks;
    }

    setExamtasksTaskvariations(examtasksTaskvariations){
        this.examtasksTaskvariations = examtasksTaskvariations;
    }

    setSavedVariations(savedVariations){
        this.savedVariations = savedVariations
    }

    //TODO

    calcMetricForSingleRow(index){
        let savedVariations = this.savedVariations;
        let row = savedVariations[index];
        let examtaskIds = Object.keys(row);

        let penaltyForRow = 0;
        for(let i=0; i<savedVariations.length; i++){
            if(i!==index){
                let compareRow = savedVariations[i];
                let rowAsList = [];
                let compareAsList = [];
                for(let j=0; j<examtaskIds.length;j++){
                    let examtaskId = examtaskIds[j];
                    if(!isNaN(examtaskId)){
                        let same = row[examtaskId] === compareRow[examtaskId];
                        rowAsList.push(1);
                        compareAsList.push(same ? 1 : -1);
                    }
                }
                let sim = similarity(rowAsList,compareAsList);
                //console.log(index+" vs. "+i+" => "+sim+"  :: "+JSON.stringify(rowAsList)+"  "+JSON.stringify(compareAsList));
                penaltyForRow += sim;
            }
        }

        return penaltyForRow/(savedVariations.length-1);
    }

    calcMetricForAllSavedVariations(){
        let savedVariations = this.savedVariations;
        let penaltyForVariations = 0;
        let highestSimilarityValue = null;
        let highestSimilarityIndex = null;
        console.log("")
        for(let i=0; i<savedVariations.length; i++){
            let penaltyForRow = this.calcMetricForSingleRow(i);
            penaltyForVariations += penaltyForRow;
            console.log(penaltyForRow+" = for index: "+i);
            if(!highestSimilarityValue || penaltyForRow > highestSimilarityValue){
                highestSimilarityValue = penaltyForRow;
                highestSimilarityIndex = i;
            }
        }
        console.log("Worst Row is: "+highestSimilarityIndex);
        console.log("")

        return -1*penaltyForVariations/(savedVariations.length);
    }





}
