import React from 'react';

export class VariationGenerator {

    static listOfVariations = [];
    static mapOfVariations = {};

    static generateNewGeneration(parents,crosspointBorder,amountOfGroups){
        let newGeneration = [];
        let desiredVariationsReached = VariationGenerator.isDesiredAmountOfGroupsReached(amountOfGroups);
        for(let f=0; f<parents.length && !desiredVariationsReached; f++){
            for(let m=0; m<parents.length && !desiredVariationsReached; m++){
                let father = parents[f];
                let mother = parents[m];
                let childs = VariationGenerator.generateChilds(father,mother, crosspointBorder,amountOfGroups);
                newGeneration = newGeneration.concat(childs);
                desiredVariationsReached = VariationGenerator.isDesiredAmountOfGroupsReached(amountOfGroups);
            }
        }
        return newGeneration;
    }

    static isDesiredAmountOfGroupsReached(amountOfGroups){
        return VariationGenerator.listOfVariations.length >= amountOfGroups;
    }

    static wasAddedToVariations(string){
        if(!VariationGenerator.mapOfVariations[string]){
            VariationGenerator.mapOfVariations[string] = true;
            VariationGenerator.listOfVariations.push(JSON.parse(string));
            return true;
        }
        return false;
    }

    static generateChilds(father, mother,crosspointBorder,amountOfGroups){
        let desiredVariationsReached = VariationGenerator.isDesiredAmountOfGroupsReached(amountOfGroups);
        let childs = [];
        for(let crosspoint=0; crosspoint<=father.length/2 && !desiredVariationsReached; crosspoint+=(crosspointBorder/2)){
            let left = [];
            let right = [];
            let crossStart = Math.floor(crosspoint);
            let crossEnd = Math.ceil(crosspoint+crosspointBorder);

            for(let i=0; i<father.length; i++){
                let withinCrossing = i>= crossStart && i<crossEnd;
                left.push(withinCrossing  ? father[i] : mother[i]);
                right.push(withinCrossing ? mother[i] : father[i]);
            }

            let leftAsString = JSON.stringify(left);
            if(VariationGenerator.wasAddedToVariations(leftAsString)){
                childs.push(JSON.parse(leftAsString));
            }

            let rightAsString = JSON.stringify(right);
            if(VariationGenerator.wasAddedToVariations(rightAsString)){
                childs.push(JSON.parse(rightAsString));
            }

            desiredVariationsReached = VariationGenerator.isDesiredAmountOfGroupsReached(amountOfGroups);

        }
        return childs;
    }

    static initParentCountList(orderedExamtasks,examtasksTaskvariations){
        let rows = [];
        for(let i=0 ; i<orderedExamtasks.length; i++){
            let examtaskId = orderedExamtasks[i].id;
            let amountVariations = examtasksTaskvariations[examtaskId].length;
            let row = [];
            for(let j=0; j<amountVariations; j++){
                row.push(0);
            }
            rows.push(row);
        }
        return rows;
    }

    static generateParents(amountSuggestionsToGenerate,orderedExamtasks,examtasksTaskvariations){
        let countRows = VariationGenerator.initParentCountList(orderedExamtasks,examtasksTaskvariations);
        let parents = [];
        let allRowsBalanced = false;
        let maxAmountGiven = !!amountSuggestionsToGenerate;
        let enoughParents = maxAmountGiven ? parents.length >= amountSuggestionsToGenerate : false;
        while(!allRowsBalanced || enoughParents){
            allRowsBalanced = true;
            let parent = [];
            for(let i=0; i<countRows.length; i++){
                let minValue = null;
                let minIndex = 0;
                for(let j=0; j<countRows[i].length; j++){
                    let amount = countRows[i][j];
                    if(minValue===null || amount < minValue){
                        minValue = amount;
                        minIndex = j;
                    }
                }
                let increasedMinValue = minValue+1;
                countRows[i][minIndex] = increasedMinValue;
                parent.push(minIndex+"");
                for(let j=0; j<countRows[i].length && allRowsBalanced; j++){
                    if(countRows[i][j] < increasedMinValue){
                        allRowsBalanced = false;
                    }
                }
            }
            parents.push(parent);
            enoughParents = maxAmountGiven ? parents.length >= amountSuggestionsToGenerate : false;
        }
        return parents;
    }

    static generateExamVariations(amountOfGroups,orderedExamtasks,examtasksTaskvariations, parents=[]){
        VariationGenerator.listOfVariations = [];
        VariationGenerator.mapOfVariations = {};

        if(parents.length>0){
            for(let i=0; i<parents.length; i++){
                let parent = parents[i];
                VariationGenerator.listOfVariations.push(parent);
                VariationGenerator.mapOfVariations[JSON.stringify(parent)] = true;
            }

            if(parents.length > 0){
                let desiredVariationsReached = VariationGenerator.isDesiredAmountOfGroupsReached(amountOfGroups);
                let crosspointBorder = parents[0].length/2;
                while(!desiredVariationsReached && crosspointBorder > 0.5){
                    let newGeneration = VariationGenerator.generateNewGeneration(parents,crosspointBorder,amountOfGroups);
                    console.log(newGeneration);
                    desiredVariationsReached = VariationGenerator.isDesiredAmountOfGroupsReached(amountOfGroups);
                    let copy = JSON.parse(JSON.stringify(newGeneration));
                    parents = copy;
                    crosspointBorder/=2;
                }
            }
        }

        return VariationGenerator.listOfVariations;
    }

}
