const request = Functions.makeHttpRequest({
    url: `https://www.googleapis.com/oauth2/v3/certs`,
    headers: {
        "Content-Type": "application/json",
    },
});

const response = await request;

if (!response.error) {
    console.log(response.data);
} else {
    console.log("Response Error");
}

