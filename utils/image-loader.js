/*
 * image-loader.worker.js
 */

// The `message` event is fired in a web worker any time `worker.postMessage(<data>)` is called.
// `event.data` represents the data being passed into a worker via `worker.postMessage(<data>)`.
self.addEventListener('message', async event => {

    const imageURL = event.data
    const response = await fetch(imageURL)
    const fileBlob = await response.blob()
    //console.log('Worker got received:', event.data)
    self.postMessage({
        blob: blob
    })

});
  