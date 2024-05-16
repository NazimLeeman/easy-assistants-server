// client.ts
import WebSocket from 'ws';
import Logger from '../src/utils/Logger';

let ws: WebSocket | null = null;

function connectToServer() {
  ws = new WebSocket('ws://localhost:8080');

  ws.on('open', () => {
    Logger.log('Connected to server');
    promptUserInput();
  });

  ws.on('message', (message: string) => {
    const data = JSON.parse(message);
    if (data.type === 'tool') {
      // TODO: Low priority, but right now, this can only do one tool response at a time
      // Server is querying the user for input
      const { functions } = data;
      // Process each function and send the responses back to the server
      const responses = functions.map(
        ({ function_name, arguments: args }: { function_name: string; arguments: any }) => {
          Logger.log(`Processing function: ${function_name} with args:`, args);

          let response;
         if(function_name === 'dataRetriever') {
            const result = dataRetrieverFunction(args);
            Logger.log(`Processing function:${result}`)
            response = result;
          } else if(function_name === 'generateInsight') {
            const result = generateInsightFunction(args);
            Logger.log(`Processing function:${result}`)
            response = result;
          }
          else {
            const result = prompt(`Enter your response for ${function_name}:`);
            Logger.log(`Response for ${function_name}: ${result}`);
            response = result;
          }

          return { function_name, response };
        },
      );
      // Send the responses back to the server
      ws?.send(JSON.stringify({ type: 'toolResponse', response: JSON.stringify(responses) }));
    } else if (data.type === 'result') {
      // Server has sent a result
      Logger.log('Result:', data.message);
      Logger.timeEnd('planTimer');
      promptUserInput();
    } else if (data.type === 'plan') {
      // Server has sent a result
      Logger.log('Here is the plan:\n', data.message);
    } else {
      // Handle other message types if needed
      Logger.log('Received message:', data);
    }
  });

  ws.on('close', () => {
    Logger.log('Disconnected from server');
    // Retry connection after 5 seconds
    setTimeout(connectToServer, 5000);
  });
}

function promptUserInput() {
  let query = prompt('Enter your message:');
  if (!query) {
    // If the query is empty, set it to the result of 3*6 divided by 2
    query = "what's 3*6 divided by 2"
    Logger.log(`No input provided. what's 3*6 divided by 2`);
  }

  if (ws) {
    Logger.time('planTimer'); // Start the timer
    ws.send(JSON.stringify({ type: 'query', task: query }));
  }
}

// function calculateResult(args: { a: number | string; b: number | string; operator: string }): number {
//   let a = typeof args.a === 'string' ? parseFloat(args.a) : args.a;
//   let b = typeof args.b === 'string' ? parseFloat(args.b) : args.b;

//   switch (args.operator) {
//     case 'add':
//     case '+':
//       return a + b;
//     case 'subtract':
//     case '-':
//       return a - b;
//     case 'multiply':
//     case '*':
//       return a * b;
//     case 'divide':
//     case '/':
//       return a / b;
//     case 'power':
//     case '^':
//       return Math.pow(a, b);
//     case 'root':
//       return Math.pow(a, 1 / b);
//     default:
//       throw new Error(`Unknown operator: ${args.operator}`);
//   }
// }

function dataRetrieverFunction(query:string) {
  console.log("Executing SQL query:", query);
    const data = [
        { TRANSACTION_ID: 1, USER_ID: 101, USER_NAME: "John Doe", PRODUCT_ID: 201, PRODUCT_NAME: "Thriller Novel", CATEGORY: "Books", PRICE: 14.99, TRANSACTION_DATE: "2024-05-10" },
        { TRANSACTION_ID: 2, USER_ID: 102, USER_NAME: "Jane Smith", PRODUCT_ID: 201, PRODUCT_NAME: "Thriller Novel", CATEGORY: "Books", PRICE: 14.99, TRANSACTION_DATE: "2024-05-11" },
        { TRANSACTION_ID: 3, USER_ID: 103, USER_NAME: "Alice Johnson", PRODUCT_ID: 201, PRODUCT_NAME: "Thriller Novel", CATEGORY: "Books", PRICE: 14.99, TRANSACTION_DATE: "2024-05-12" }
    ];

    return data;
}

// function generateInsightFunction(data:any) {
//   console.log("Analyzing retrieved data:", data);
//     const insight = "The transactions for the 'Thriller Novel' occurred consecutively over three days (May 10th to May 12th).";
    
//     return insight;
// }

function generateInsightFunction(data: { data: string }) {
    const rawData = data.data;
    console.log("Analyzing retrieved data:", rawData);
    // console.log("Type of data:", typeof rawData);
    // const dataArray = JSON.parse(rawData); 
    // const productNames = dataArray.map((entry:any) => entry.PRODUCT_NAME);
    // const totalPrice = dataArray.reduce((total:any, entry:any) => total + entry.PRICE, 0);
    // const averagePrice = totalPrice / dataArray.length;
  
    let insights;
  
    // const transactionDates = dataArray.map((entry:any) => new Date(entry.TRANSACTION_DATE));
    // const sortedTransactionDates = transactionDates.sort((a:any, b:any) => a.getTime() - b.getTime());
    // const firstTransactionDate = sortedTransactionDates[0];
    // const lastTransactionDate = sortedTransactionDates[sortedTransactionDates.length - 1];
    // insights.push(`Insight: The transactions for the "${productNames[0]}" occurred consecutively over three days (${formatDate(firstTransactionDate)} to ${formatDate(lastTransactionDate)}).`);
  
    // insights.push(`Insight: The price point of the "${productNames[0]}" at $${averagePrice.toFixed(2)} seems affordable and could be driving sales.`);
  
    return insights;
  }
  
  function formatDate(date: Date) {
      return date.toLocaleDateString('en-US');
  }

connectToServer();
