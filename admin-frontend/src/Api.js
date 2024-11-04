export async function getUserDetails(){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/get_user_details/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function delete_user(username){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/delete_user/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username : username
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function grant_app_access(username,appname){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/grant_app_access/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username : username,
            appname : appname
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function revoke_app_access(username,appname){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/revoke_app_access/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username : username,
            appname : appname
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function disable_all_access(username){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/disable_all_access/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username : username,
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function give_all_access(username){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/give_all_access/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username : username,
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function token_usage(){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/token_usage/`, {
        method: "GET",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
    });
    const result = await response.json();
    // console.log(result)
    return result.data
}

export async function totalusers(){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/totalusers/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function total_tokens(){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/total_tokens/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function total_input_tokens(){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/total_input_tokens/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function total_output_tokens(){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/total_output_tokens/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}


export async function total_tokens_per_user(username){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/total_tokens_per_user/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "username" : username
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}


export async function total_input_tokens_per_user(username){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/total_input_tokens_per_user/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "username" : username
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function total_output_tokens_per_user(username){
    // console.log(text)
    const response = await fetch(`http://10.124.10.136:8001/total_output_tokens_per_user/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "username" : username
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}