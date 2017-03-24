/** Configuração de Mensagem de saída da aplicação por módulos **/
global.messages = {
    default: {
        app_not_permission: "Ação não permitida para a aplicação informada!",
    },
    application: {
        undefined: 'Identificador da aplicação não informado na requisição!',
        not_found: 'Aplicação informada não existe!',
        not_active: 'A aplicação informada foi desativa pelo gestor do sistema!',
    },
    user: {
        undefined: 'ID do usuário não foi informado na requisição!',
        id_undefined: 'Usuário informado não existe!',
        email_undefined: 'E-mail de login não informado ou está em branco!',
        password_undefined: 'Senha de login não informada ou está em branco!',
        current_password_error: 'A senha atual informada não confere!',
        new_password_undefined: 'Nova senha senha de login não informada ou está em branco!',
        user_not_found: 'Usuário informado não encontrado!',
        password_error: 'E-mail ou senha informada não confere!',
        inactive_error: 'Conta de usuário inativa ou suspensa!',
        auth_error: 'Houve um problema na autenticação do usuário!',
        user_exist: 'E-mail informado já registrado no sistema!',
        client_not_found: 'Este usuário não está associado a uma conta de cliente ativo!',
        token_invalid: 'Token expirado. Faça novo login para acessar a aplicação!',
        branch_not_found: 'Usuário não possui ramal registrado!',
        branch_suspended: 'Este ramal está com acesso suspenso!',
        branch_login_error: "Houve um problema na excução do login do ramal!",
        branch_mode_ip: "Ramal configurado para telefone IP!",
        not_pemission: 'Conta de usuário não possui permissão para esta operação!',
    },
    pbx: {
        client: {
            undefined: 'ID do cliente não foi informado na requisição!',
            not_found: 'Cliente informado não registrado no sistema!',
            user_not_found: 'Usuário não relacionado a conta de um cliente ativo!',
            user_not_pemission: 'Conta de usuário não possui permissão para esta operação!',
            email_exists: 'Ops! Identificamos que já existe uma conta para o e-email informado!',
            name_undefined: 'O nome não foi informado!',
            email_undefined: 'O E-mail não foi informado!',
            branch_number: {
                client_not_found: 'Cliente informado não registrado no sistema!',
                user_undefined: 'Usuário não informado ou está em branco!',
                branch_agent_not_found: 'A conta não possui licenças PREMIUM disponíveis no momento para registrar este ramal! Adquira novas licenças e tente novamente!',
                branch_voip_not_found: 'A conta não possui licenças CLASSIC disponíveis no momento para registrar este ramal! Adquira novas licenças e tente novamente!',
                branch_duplicate_user: 'O usuário informado já está registrado para outro ramal nesta conta! Altere o usuário e tente novamente!',
                branch_save_error: "Não foi possível salvar os dados do ramal informado! Tente novamente!",
                branch_update_agent_not_found: 'O Ramal não pode ser atualizado porque você não possui licença de Agente!',
                branch_update_voip_not_found: 'O Ramal não pode ser atualizado porque você não possui licença de Voip!',
                remove_yourself: 'Ops! Você não pode excluir seu próprio ramal!',
                remove_admin: 'Ops! Este ramal é único administrador do sistema e não pode ser removido!'
            },
        },
    }
}


