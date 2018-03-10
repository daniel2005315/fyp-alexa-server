// Handling intent routing

// Handle daily.user.status
// Reply according to user's status
async function dailyStatus(req){
  console.log("***dailyStatus async call");
  console.log(req.body.result.parameters.sentiment_degree);
  var response = "I got your feelings";
  return response;
};


module.exports = {

  // Match intent with intent handlers
  parse: async function(intent, req) {
    console.log("Intent routing");
    if(input==='daily.user.status'){
      let response;
      try{
        response = await dailyStatus(req);
        return response;
      }catch(err){
        console.log(err);
        return -1;
      }
    }

    // Error to be handled
    return -1;
  }
}
