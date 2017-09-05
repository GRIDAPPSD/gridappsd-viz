
const responseQueueMessage = {
  simulationID: 'sim1'
};

function subscribe(url) {
  return new Promise((resolve, reject) => {
    
    process.nextTick(
      () => responseQueueMessage.simulationID ? resolve(responseQueueMessage.simulationID) : reject({
        error: 'Simulation ID not found.',
      })
    );
  });
}
module.exports = subscribe;