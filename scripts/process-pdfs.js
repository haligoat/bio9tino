import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const PDF_DIR = './pdfs';
const DATA_DIR = './src/data';
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY not found in .env file.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" }
});

async function processPdf(fileName) {
  const filePath = path.join(PDF_DIR, fileName);
  const dataBuffer = fs.readFileSync(filePath);
  
  console.log(`Extracting text from ${fileName}...`);
  const data = await pdf(dataBuffer);
  const text = data.text;

  console.log(`Generating study materials for ${fileName} via Gemini...`);
  
  const prompt = `
    Extract vocabulary and create a quiz from the following study guide text.
    Return a JSON object with this exact structure:
    {
      "title": "Clear Unit Title",
      "vocab": [ { "term": "...", "definition": "..." } ],
      "quizzes": [ 
        { "type": "multiple-choice", "question": "...", "options": ["A", "B", "C", "D"], "answer": "The exact correct option string" },
        { "type": "short-answer", "question": "...", "answer": "the answer" }
      ]
    }
    Requirements:
    - Extract ALL key terms and definitions.
    - Create at least 20-30 quiz questions based on the content.
    - Mix multiple-choice and short-answer questions.
    - Ensure all information is accurate to the text.
    - JSON must be valid.

    TEXT:
    ${text}
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonData = JSON.parse(responseText);
    
    const outputName = fileName.toLowerCase().replace(/\s+/g, '-').replace('.pdf', '.json');
    const outputPath = path.join(DATA_DIR, outputName);
    
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
    console.log(`SUCCESS: Created ${outputPath}`);
  } catch (error) {
    console.error(`FAILED to process ${fileName}:`, error);
  }
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const files = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
  
  for (const file of files) {
    const jsonName = file.toLowerCase().replace(/\s+/g, '-').replace('.pdf', '.json');
    if (!fs.existsSync(path.join(DATA_DIR, jsonName))) {
      await processPdf(file);
    } else {
      console.log(`Skipping ${file} (already processed)`);
    }
  }
}

main();
