// Splash Screen
setTimeout(() => {
    document.getElementById("splash--container").style.opacity = 0;
    setTimeout(() => {
        document.getElementById("nonsplash--container").style.opacity = 1;
    }, 500);
}, 2_000);