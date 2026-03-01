package br.com.horizon.portal.infrastructure.security;

import br.com.horizon.portal.infrastructure.persistence.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AutenticacaoService implements UserDetailsService {

    @Autowired
    private UsuarioRepository repository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Garantimos que a busca no banco seja feita apenas com os números do CPF
        String cpfLimpo = username.replaceAll("\\D", "");
        
        UserDetails usuario = repository.findByCpf(cpfLimpo);
        if (usuario == null) {
            throw new UsernameNotFoundException("Utilizador não encontrado com o CPF informado!");
        }
        return usuario;
    }
}