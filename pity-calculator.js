module.exports = {
    pity5S: function(currentPity) {
        currentPity += 1;
        
        switch (currentPity) {
            case 74:
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 732) {
                    return true;
                }
                break;
            case 75: 
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 1300) {
                    return true;
                }
                break;
            case 76: 
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 1880) {
                    return true;
                }
                break;
            case 77:
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 2459) {
                    return true;
                }
                break;
            case 78: 
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 3043) {
                    return true;
                }
                break;
            case 79:
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 3621) {
                    return true;
                }
                break;
            case 80:
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 4191) {
                    return true;
                }
                break;
            case 81:
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 4728) {
                    return true;
                }
                break;
            case 82: 
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 5223) {
                    return true;
                }
                break;
            case 83: 
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 5583) {
                    return true;
                }
                break;
            case 84: // From here on it's a linear progression of +5.6% every wish until wish 90, based on the average ROC of wishes 73-82
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 6143) {
                    return true;
                }
                break;
            case 85:
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 6703) {
                    return true;
                }
                break;
            case 86:
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 7263) {
                    return true;
                }
                break;
            case 87:
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 7823) {
                    return true;
                }
                break;
            case 88:
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 8383) {
                    return true;
                }
                break;
            case 89:
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 8943) {
                    return true;
                }
                break;
            case 90:
                return true;
        }
        return false;
    },

    pity4S: function(currentPity) {
        currentPity += 1;

        switch (currentPity) {
            case 9:
                var check = Math.floor(Math.random() * (10000) + 1)
                if (check < 3510) {
                    return true;
                }
                break;
            case 10:
                return true;
        }
        return false;
    }
}