async function pair() {

    const phone = document.getElementById("phone").value;

    const res = await fetch("/pair", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone })
    });

    const data = await res.json();

    if (data.pairing_code) {
        document.getElementById("result").innerText = data.pairing_code;
    } else {
        document.getElementById("result").innerText = "Error generating code";
    }
}
