import { loadThreads, addEventHandlers, getThreadStore } from '../client/scripts/controllers/orbitdb';

addEventHandlers((threads) => {
  console.log('threads refreshed');
  console.log(threads);
}, (comments) => {
  console.log('comments refreshed');
  console.log(comments);
}).then(() => {
  console.log('added event handlers');
  return loadThreads();
}).then((threads) => {
  console.log('threads loaded');
  console.log(threads);
});
