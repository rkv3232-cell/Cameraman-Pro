export const formatMoney = (amount: number) => {
    if (isNaN(amount) || amount === 0) return "₹0";
    const val = Math.floor(amount).toString();
    const lastThree = val.substring(val.length - 3);
    const otherNumbers = val.substring(0, val.length - 3);
    if (otherNumbers !== '') {
        return "₹" + otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    }
    return "₹" + lastThree;
};
