export default class MyFileHelper {

  static arrayBufferToBlob(arrayAsString){
    let bytes = new Uint8Array(arrayAsString.length);
    for (let i=0; i<arrayAsString.length; i++){
      bytes[i] = arrayAsString.charCodeAt(i);
    }

    let blob = new Blob([bytes], {type: "application/pdf"});
    return blob;
  }

}
