const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const Usuario = require('../models/users');

function cifrarSenha(senha, salto){
    const hash = crypto.createHmac("sha256", salto);
    hash.update(senha);
    return hash.digest('hex');
}

async function criar(req,res){
    const salto = crypto.randomBytes(16).toString('hex');
    const senhaCifrada = cifrarSenha(req.body.senha, salto);

    const novoUsuario = await Usuario.create({
        email: req.body.email,
        senha: senhaCifrada,
        salto
    });
    res
    .status(201)
    .json({
        id: novoUsuario._id.toString(), 
        email: novoUsuario.email,
        senha: novoUsuario.senha,
        salto: novoUsuario.salto
    });
};

async function entrar(req,res){
    const usuarioEncontrado = await Usuario.findOne({email: req.body.email});
    if(usuarioEncontrado){
        const senhaCifrada = cifrarSenha(req.body.senha, usuarioEncontrado.salto);
        if(usuarioEncontrado.senha === senhaCifrada){
            res.json({token: jwt.sign({email: usuarioEncontrado.email}, process.env.SEGREDO, {expiresIn: "2m"}) });
        } else{
            res.status(401).json({msg: "Acesso negado!"});
        }
    } else {
        res.status(400).json({msg: "Credenciais invalidas!"});
    }
}
function renovar(req,res){
    const token = req.headers['authorization'];
    if(token){
        try{
            const payload = jwt.verify(token, process.env.SEGREDO);
            res.json({token: jwt.sign({email: payload}, process.env.SEGREDO)});

        } catch (e){
            res.status(401).json({msg: "Token invalido"})
        }
    } else{
        res.status(400).json({msg: "Token não enviado!"})
    }
}

module.exports = {criar, entrar, renovar};