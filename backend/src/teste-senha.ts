import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function testar() {
    // 1. Dados que você usou no SEED e no LOGIN
    const senhaDigitadaNoFront = '@Admin123';
    const hashQueEstaNoDBeaver = '$2b$10$zMtMUX5FRAxoZVKiEsSoW.pe23p7K83/.XI6ISCQs7RxyiaEWq4Xm';

    // 2. Seus "temperos" (Prefixos e Sufixos)
    const p_front = "dc@";
    const s_front = "@dc";
    const p_srv = "dc#srv#";
    const s_srv = "#srv#dc";

    // --- SIMULANDO O FRONT ---
    const hashFront = crypto
        .createHash('sha256')
        .update(p_front + senhaDigitadaNoFront + s_front)
        .digest('hex');
    
    console.log("1. Hash gerado (simulando front):", hashFront);

    // --- SIMULANDO O BACK ---
    const textoParaComparar = p_srv + hashFront + s_srv;
    console.log("2. Texto final que vai para o Bcrypt:", textoParaComparar);

    // --- A HORA DA VERDADE ---
    const bateu = await bcrypt.compare(textoParaComparar, hashQueEstaNoDBeaver);
    
    if (bateu) {
        console.log("✅ SUCESSO: A lógica de hash bate com o banco!");
    } else {
        console.log("❌ ERRO: A lógica NÃO BATE. Algum prefixo está diferente.");
    }
}

testar();