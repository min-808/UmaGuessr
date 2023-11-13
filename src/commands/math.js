const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('math')
    .setDescription('This command allows you to do simple calculations')
    //.setDescription('TEST COMMAND')
    .addStringOption((option) => 
        option
            .setName("operation")
            .setDescription("Choose an operation")
            .setRequired(true)
            .setChoices(
                {
                    name: 'add',
                    value: 'add'
                },
                {
                    name: 'subtract',
                    value: 'subtract'
                },
                {
                    name: 'multiply',
                    value: 'multiply'
                },
                {
                    name: 'divide',
                    value: 'divide'
                }
            )
    )
    .addNumberOption((option) => 
        option
            .setName("first-number")
            .setDescription("Enter the first number")
            .setRequired(true)
    )
    .addNumberOption((option) => 
        option
            .setName("second-number")
            .setDescription("Enter the second number")
            .setRequired(true)
    )
        
    ,
    run: ({ interaction }) => {
        const op = interaction.options.get('operation').value;
        const num1 = interaction.options.get('first-number').value; // ?.value for optional chaining
        const num2 = interaction.options.get('second-number').value;

        var result = null;
        var opTitle = null;

        if (op === 'add') {
            result = num1 + num2;
            opTitle = "sum"
        } else if (op === 'subtract') {
            result = num1 - num2;
            opTitle = "difference"
        } else if (op === 'multiply') {
            result = num1 * num2;
            opTitle = "product"
        } else if (op === 'divide') {
            result = (num1 / num2).toFixed(2);
            opTitle = "quotient"
        }

        // const user = process.env.CLIENT_ID.users.cache.get(236186510326628353);
    
        /*
        fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/characters.json')
        .then(res =>
            user.send(res)
        })
        */

        /*
        fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/49b0d3031e1d35c5cba936233af3a33a7237e8c9/image/character_portrait/1001.png')
        .then(res => res.json())
        .then(json => {
            user.send(json)
        })
        */

        interaction.reply(`The ${opTitle} of \`${num1} and ${num2}\` is \`${result}\``)
    }
}
