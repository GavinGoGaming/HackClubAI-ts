const PROMPTING = {
    currentDateTime: () => {
        return `The current year is ${new Date().getFullYear()}. The current date and time is ${new Date().toLocaleString()}.`;
    }
}
export default PROMPTING;