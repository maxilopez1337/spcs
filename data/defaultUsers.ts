
import { User } from '../types';

// Funkcja generująca losowe hasła dla danych seedowych
const generateRandomPass = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
};

// Lista surowa (Hasła tutaj są nadpisywane przez logikę poniżej, chyba że to Admin)
const RAW_USERS: User[] = [
  // SYSTEMOWI (Te hasła zostaną zachowane)
  { id: 'admin-root', email: 'admin@stratton-prime.pl', password: '1Haslo1haslo1', firstName: 'System', lastName: 'Administrator', hierarchicalId: 'ROOT', role: 'ADMIN' },
  { id: 'admin-dws', email: 'dws@stratton-prime.pl', password: 'Stratton2025!', firstName: 'Dział', lastName: 'Wsparcia Sprzedaży', hierarchicalId: 'DWS', role: 'ADMIN' },
  { id: 'test-user-dev', email: 'test@stratton-prime.pl', password: 'Test1234', firstName: 'Tester', lastName: 'Testowy', hierarchicalId: 'DEV-TEST-01', role: 'USER', managerName: 'Biuro Stratton', managerEmail: 'biuro@stratton-prime.pl' },

  // NOWE KONTO TESTOWE (Maciej Hagno)
  { 
      id: 'test-pass-user', 
      email: 'maciej.hagno@gmail.com', 
      password: 'Test1234', 
      firstName: 'Maciej', 
      lastName: 'Hagno', 
      hierarchicalId: 'TEST-PASS-MH', 
      role: 'USER', 
      managerName: 'Biuro Zarządu', 
      managerEmail: 'biuro@stratton-prime.pl' 
  },

  // GDJJ ROOT (Admin - hasło zachowane)
  { id: 'u1', hierarchicalId: 'GDJJ', role: 'ADMIN', firstName: 'Jakub', lastName: 'Jabłoński', email: 'j.jablonski@stratton-prime.pl', password: 'Stratton2025!' },

  // --- PRACOWNICY (Hasła zostaną podmienione na losowe) ---

  // GAŁĄŹ JAROSŁAW ADAMCZYK
  { id: 'u2', hierarchicalId: 'GDJJ/JA', role: 'MANAGER', firstName: 'Jarosław', lastName: 'Adamczyk', email: 'j.adamczyk@stratton-prime.pl', password: 'TEMP', managerName: 'Jakub Jabłoński', managerEmail: 'j.jablonski@stratton-prime.pl' },
  { id: 'u9', hierarchicalId: 'GDJJ/JA/AL', role: 'USER', firstName: 'Alicja', lastName: 'Lietz', email: 'a.lietz@stratton-prime.pl', password: 'TEMP', managerName: 'Jarosław Adamczyk', managerEmail: 'j.adamczyk@stratton-prime.pl' },
  { id: 'u22', hierarchicalId: 'GDJJ/JA/KG', role: 'USER', firstName: 'Karolina', lastName: 'Galera', email: 'k.galera@stratton-prime.pl', password: 'TEMP', managerName: 'Jarosław Adamczyk', managerEmail: 'j.adamczyk@stratton-prime.pl' },
  { id: 'u48', hierarchicalId: 'GDJJ/JA/KB', role: 'USER', firstName: 'Kamil', lastName: 'Buczak', email: 'k.buczak@stratton-prime.pl', password: 'TEMP', managerName: 'Jarosław Adamczyk', managerEmail: 'j.adamczyk@stratton-prime.pl' },

  // GAŁĄŹ URSZULA DYNOWSKA (pod JA)
  { id: 'u3', hierarchicalId: 'GDJJ/JA/UD', role: 'MANAGER', firstName: 'Urszula', lastName: 'Dynowska', email: 'u.dynowska@stratton-prime.pl', password: 'TEMP', managerName: 'Jarosław Adamczyk', managerEmail: 'j.adamczyk@stratton-prime.pl' },
  { id: 'u4', hierarchicalId: 'GDJJ/JA/UD/MS', role: 'MANAGER', firstName: 'Malgorzata', lastName: 'Sienkiewicz-Łuczyn', email: 'm.sienkiewicz@stratton-prime.pl', password: 'TEMP', managerName: 'Urszula Dynowska', managerEmail: 'u.dynowska@stratton-prime.pl' },
  { id: 'u28', hierarchicalId: 'GDJJ/JA/UD/MS/RW', role: 'USER', firstName: 'Rafał', lastName: 'Wojtas', email: 'r.wojtas@stratton-prime.pl', password: 'TEMP', managerName: 'Malgorzata Sienkiewicz-Łuczyn', managerEmail: 'm.sienkiewicz@stratton-prime.pl' },
  { id: 'u29', hierarchicalId: 'GDJJ/JA/UD/MS/PA', role: 'USER', firstName: 'Piotr', lastName: 'Amanowicz', email: 'p.amanowicz@stratton-prime.pl', password: 'TEMP', managerName: 'Malgorzata Sienkiewicz-Łuczyn', managerEmail: 'm.sienkiewicz@stratton-prime.pl' },

  // GAŁĄŹ MARIOLA GWIZDAŁA (pod UD)
  { id: 'u32', hierarchicalId: 'GDJJ/JA/UD/MG', role: 'MANAGER', firstName: 'Mariola', lastName: 'Gwizdała', email: 'm.gwizdala@stratton-prime.pl', password: 'TEMP', managerName: 'Urszula Dynowska', managerEmail: 'u.dynowska@stratton-prime.pl' },
  { id: 'u37', hierarchicalId: 'GDJJ/JA/UD/MG/AD', role: 'USER', firstName: 'Anna', lastName: 'Drywa', email: 'a.drywa@stratton-prime.pl', password: 'TEMP', managerName: 'Mariola Gwizdała', managerEmail: 'm.gwizdala@stratton-prime.pl' },
  { id: 'u38', hierarchicalId: 'GDJJ/JA/UD/MG/AK', role: 'USER', firstName: 'Aleksandra', lastName: 'Koszczyc', email: 'a.koszczyc@stratton-prime.pl', password: 'TEMP', managerName: 'Mariola Gwizdała', managerEmail: 'm.gwizdala@stratton-prime.pl' },
  { id: 'u39', hierarchicalId: 'GDJJ/JA/UD/MG/SG', role: 'USER', firstName: 'Sabrina', lastName: 'Gralak', email: 's.gralak@stratton-prime.pl', password: 'TEMP', managerName: 'Mariola Gwizdała', managerEmail: 'm.gwizdala@stratton-prime.pl' },
  { id: 'u40', hierarchicalId: 'GDJJ/JA/UD/MG/OM', role: 'USER', firstName: 'Oliwia', lastName: 'Mielewczyk', email: 'o.mielewczyk@stratton-prime.pl', password: 'TEMP', managerName: 'Mariola Gwizdała', managerEmail: 'm.gwizdala@stratton-prime.pl' },
  { id: 'u41', hierarchicalId: 'GDJJ/JA/UD/MG/EM', role: 'USER', firstName: 'Ewelina', lastName: 'Muttka', email: 'e.muttka@stratton-prime.pl', password: 'TEMP', managerName: 'Mariola Gwizdała', managerEmail: 'm.gwizdala@stratton-prime.pl' },
  { id: 'u42', hierarchicalId: 'GDJJ/JA/UD/MG/PG', role: 'USER', firstName: 'Patryk', lastName: 'Gwizdała', email: 'p.gwizdala@stratton-prime.pl', password: 'TEMP', managerName: 'Mariola Gwizdała', managerEmail: 'm.gwizdala@stratton-prime.pl' },
  { id: 'u43', hierarchicalId: 'GDJJ/JA/UD/MG/NM', role: 'USER', firstName: 'Natalia', lastName: 'Malinowska', email: 'n.malinowska@stratton-prime.pl', password: 'TEMP', managerName: 'Mariola Gwizdała', managerEmail: 'm.gwizdala@stratton-prime.pl' },

  // GAŁĄŹ MARZANNA SZAROLKIEWICZ (pod UD)
  { id: 'u31', hierarchicalId: 'GDJJ/JA/UD/MS1', role: 'MANAGER', firstName: 'Marzanna', lastName: 'Szarolkiewicz', email: 'm.szarolkiewicz@stratton-prime.pl', password: 'TEMP', managerName: 'Urszula Dynowska', managerEmail: 'u.dynowska@stratton-prime.pl' },
  { id: 'u34', hierarchicalId: 'GDJJ/JA/UD/MS1/RO', role: 'USER', firstName: 'Robert', lastName: 'Ogonowski', email: 'r.ogonowski@stratton-prime.pl', password: 'TEMP', managerName: 'Marzanna Szarolkiewicz', managerEmail: 'm.szarolkiewicz@stratton-prime.pl' },
  { id: 'u35', hierarchicalId: 'GDJJ/JA/UD/MS1/MK', role: 'USER', firstName: 'Martyna', lastName: 'Kwiatkowska', email: 'm.kwiatkowska@stratton-prime.pl', password: 'TEMP', managerName: 'Marzanna Szarolkiewicz', managerEmail: 'm.szarolkiewicz@stratton-prime.pl' },
  { id: 'u44', hierarchicalId: 'GDJJ/JA/UD/MS1/KG', role: 'USER', firstName: 'Krzysztof', lastName: 'Grygierzec', email: 'k.grygierzec@stratton-prime.pl', password: 'TEMP', managerName: 'Marzanna Szarolkiewicz', managerEmail: 'm.szarolkiewicz@stratton-prime.pl' },
  { id: 'u46', hierarchicalId: 'GDJJ/JA/UD/MS1/JP', role: 'USER', firstName: 'Jarosław', lastName: 'Pawłowski', email: 'j.pawlowski@stratton-prime.pl', password: 'TEMP', managerName: 'Marzanna Szarolkiewicz', managerEmail: 'm.szarolkiewicz@stratton-prime.pl' },
  { id: 'u47', hierarchicalId: 'GDJJ/JA/UD/MS1/MN', role: 'USER', firstName: 'Michał', lastName: 'Nizgórski', email: 'm.nizgorski@stratton-prime.pl', password: 'TEMP', managerName: 'Marzanna Szarolkiewicz', managerEmail: 'm.szarolkiewicz@stratton-prime.pl' },

  // GAŁĄŹ PRZEMYSŁAW GRUCHALSKI (pod MS1 - Marzanna)
  { id: 'u51', hierarchicalId: 'GDJJ/JA/MS1/PG', role: 'MANAGER', firstName: 'Przemysław', lastName: 'Gruchalski', email: 'p.gruchalski@stratton-prime.pl', password: 'TEMP', managerName: 'Marzanna Szarolkiewicz', managerEmail: 'm.szarolkiewicz@stratton-prime.pl' },
  { id: 'u52', hierarchicalId: 'GDJJ/JA/MS1/PG/MG', role: 'USER', firstName: 'Monika', lastName: 'Gdanietz', email: 'm.gdanietz@stratton-prime.pl', password: 'TEMP', managerName: 'Przemysław Gruchalski', managerEmail: 'p.gruchalski@stratton-prime.pl' },
  { id: 'u53', hierarchicalId: 'GDJJ/JA/MS1/PG/KW', role: 'USER', firstName: 'Kamil', lastName: 'Wieczerzak', email: 'k.wieczerzak@stratton-prime.pl', password: 'TEMP', managerName: 'Przemysław Gruchalski', managerEmail: 'p.gruchalski@stratton-prime.pl' },
  { id: 'u54', hierarchicalId: 'GDJJ/JA/MS1/PG/KD', role: 'USER', firstName: 'Krzysztof', lastName: 'Dziekoński', email: 'k.dziekonski@stratton-prime.pl', password: 'TEMP', managerName: 'Przemysław Gruchalski', managerEmail: 'p.gruchalski@stratton-prime.pl' },
  { id: 'u55', hierarchicalId: 'GDJJ/JA/MS1/PG/MG1', role: 'USER', firstName: 'Michał', lastName: 'Gołębiowski', email: 'm.golebiowski@stratton-prime.pl', password: 'TEMP', managerName: 'Przemysław Gruchalski', managerEmail: 'p.gruchalski@stratton-prime.pl' },
  { id: 'u56', hierarchicalId: 'GDJJ/JA/MS1/PG/PA', role: 'USER', firstName: 'Piotr', lastName: 'Andrzejewski', email: 'p.andrzejewski@stratton-prime.pl', password: 'TEMP', managerName: 'Przemysław Gruchalski', managerEmail: 'p.gruchalski@stratton-prime.pl' },

  // GAŁĄŹ RAFAŁ CHOROSZYŃSKI (pod JA)
  { id: 'u5', hierarchicalId: 'GDJJ/JA/RC', role: 'MANAGER', firstName: 'Rafał', lastName: 'Choroszynski', email: 'r.choroszynski@stratton-prime.pl', password: 'TEMP', managerName: 'Jarosław Adamczyk', managerEmail: 'j.adamczyk@stratton-prime.pl' },
  { id: 'u6', hierarchicalId: 'GDJJ/JA/RC/PS', role: 'USER', firstName: 'Patryk', lastName: 'Szerniewicz', email: 'p.szerniewicz@stratton-prime.pl', password: 'TEMP', managerName: 'Rafał Choroszynski', managerEmail: 'r.choroszynski@stratton-prime.pl' },
  { id: 'u7', hierarchicalId: 'GDJJ/JA/RC/PP', role: 'USER', firstName: 'Piotr', lastName: 'Pstrocki', email: 'p.pstrocki@stratton-prime.pl', password: 'TEMP', managerName: 'Rafał Choroszynski', managerEmail: 'r.choroszynski@stratton-prime.pl' },
  { id: 'u8', hierarchicalId: 'GDJJ/JA/RC/JL', role: 'USER', firstName: 'Joanna', lastName: 'Lisowska', email: 'j.lisowska@stratton-prime.pl', password: 'TEMP', managerName: 'Rafał Choroszynski', managerEmail: 'r.choroszynski@stratton-prime.pl' },
  { id: 'u30', hierarchicalId: 'GDJJ/JA/RC/MC', role: 'USER', firstName: 'Małgorzata', lastName: 'Cholewicka', email: 'm.cholewicka@stratton-prime.pl', password: 'TEMP', managerName: 'Rafał Choroszynski', managerEmail: 'r.choroszynski@stratton-prime.pl' },

  // GAŁĄŹ NATALIA KROPEZ (pod GDJJ)
  { id: 'u10', hierarchicalId: 'GDJJ/NK', role: 'MANAGER', firstName: 'Natalia', lastName: 'Kropez', email: 'natalia.kvk@stratton-prime.pl', password: 'TEMP', managerName: 'Jakub Jabłoński', managerEmail: 'j.jablonski@stratton-prime.pl' },
  { id: 'u12', hierarchicalId: 'GDJJ/NK/KR', role: 'USER', firstName: 'Krzysztof', lastName: 'Rimpel', email: 'k.rimpel@stratton-prime.pl', password: 'TEMP', managerName: 'Natalia Kropez', managerEmail: 'natalia.kvk@stratton-prime.pl' },
  { id: 'u13', hierarchicalId: 'GDJJ/NK/JW', role: 'USER', firstName: 'Jacek', lastName: 'Wojtyra', email: 'j.wojtyra@stratton-prime.pl', password: 'TEMP', managerName: 'Natalia Kropez', managerEmail: 'natalia.kvk@stratton-prime.pl' },
  { id: 'u14', hierarchicalId: 'GDJJ/NK/PP', role: 'USER', firstName: 'Paweł', lastName: 'Pikiewicz', email: 'p.pikiewicz@stratton-prime.pl', password: 'TEMP', managerName: 'Natalia Kropez', managerEmail: 'natalia.kvk@stratton-prime.pl' },
  { id: 'u15', hierarchicalId: 'GDJJ/NK/ID', role: 'USER', firstName: 'Ireneusz', lastName: 'Damps', email: 'i.damps@stratton-prime.pl', password: 'TEMP', managerName: 'Natalia Kropez', managerEmail: 'natalia.kvk@stratton-prime.pl' },
  { id: 'u27', hierarchicalId: 'GDJJ/NK/PG', role: 'USER', firstName: 'Piotr', lastName: 'Głogowski', email: 'p.glogowski@stratton-prime.pl', password: 'TEMP', managerName: 'Natalia Kropez', managerEmail: 'natalia.kvk@stratton-prime.pl' },
  { id: 'u36', hierarchicalId: 'GDJJ/NK/MS', role: 'USER', firstName: 'Mikołaj', lastName: 'Skonieczka', email: 'm.skonieczka@stratton-prime.pl', password: 'TEMP', managerName: 'Natalia Kropez', managerEmail: 'natalia.kvk@stratton-prime.pl' },

  // GAŁĄŹ KAROL JACKIEWICZ (pod NK)
  { id: 'u11', hierarchicalId: 'GDJJ/NK/KJ', role: 'MANAGER', firstName: 'Karol', lastName: 'Jackiewicz', email: 'k.jackiewicz@stratton-prime.pl', password: 'TEMP', managerName: 'Natalia Kropez', managerEmail: 'natalia.kvk@stratton-prime.pl' },
  { id: 'u57', hierarchicalId: 'GDJJ/NK/KJ/ŁK', role: 'USER', firstName: 'Łukasz', lastName: 'Gabriel', email: 'l.gabriel@stratton-prime.pl', password: 'TEMP', managerName: 'Karol Jackiewicz', managerEmail: 'k.jackiewicz@stratton-prime.pl' },

  // GAŁĄŹ TYMOTEUSZ PAWLIKOWSKI (pod GDJJ)
  { id: 'u19', hierarchicalId: 'GDJJ/TP', role: 'MANAGER', firstName: 'Tymoteusz', lastName: 'Pawlikowski', email: 't.pawlikowski@stratton-prime.pl', password: 'TEMP', managerName: 'Jakub Jabłoński', managerEmail: 'j.jablonski@stratton-prime.pl' },
  { id: 'u20', hierarchicalId: 'GDJJ/TP/MY', role: 'USER', firstName: 'Maksym', lastName: 'Yakymchuk', email: 'm.yakymchuk@stratton-prime.pl', password: 'TEMP', managerName: 'Tymoteusz Pawlikowski', managerEmail: 't.pawlikowski@stratton-prime.pl' },
  { id: 'u24_fix', hierarchicalId: 'GDJJ/TP/AB', role: 'USER', firstName: 'Andrzej', lastName: 'Bal', email: 'a.bal@stratton-prime.pl', password: 'TEMP', managerName: 'Tymoteusz Pawlikowski', managerEmail: 't.pawlikowski@stratton-prime.pl' },

  // GAŁĄŹ KRZYSZTOF KORTAS (pod TP)
  { id: 'u21', hierarchicalId: 'GDJJ/TP/KK', role: 'MANAGER', firstName: 'Krzysztof', lastName: 'Kortas', email: 'k.kortas@stratton-prime.pl', password: 'TEMP', managerName: 'Tymoteusz Pawlikowski', managerEmail: 't.pawlikowski@stratton-prime.pl' },
  { id: 'u49', hierarchicalId: 'GDJJ/TP/KK/SI', role: 'USER', firstName: 'Serchii', lastName: 'Ivanchenko', email: 's.ivanchenko@stratton-prime.pl', password: 'TEMP', managerName: 'Krzysztof Kortas', managerEmail: 'k.kortas@stratton-prime.pl' },

  // GAŁĄŹ KACPER REŃSKI (pod GDJJ)
  { id: 'u23', hierarchicalId: 'GDJJ/KR', role: 'MANAGER', firstName: 'Kacper', lastName: 'Reński', email: 'k.renski@stratton-prime.pl', password: 'TEMP', managerName: 'Jakub Jabłoński', managerEmail: 'j.jablonski@stratton-prime.pl' },
  { id: 'u25', hierarchicalId: 'GDJJ/KR/PL', role: 'USER', firstName: 'Paweł', lastName: 'Lubiński', email: 'p.lubinski@stratton-prime.pl', password: 'TEMP', managerName: 'Kacper Reński', managerEmail: 'k.renski@stratton-prime.pl' },
  { id: 'u26', hierarchicalId: 'GDJJ/KR/PW', role: 'USER', firstName: 'Przemysław', lastName: 'Wolski', email: 'p.wolski@stratton-prime.pl', password: 'TEMP', managerName: 'Kacper Reński', managerEmail: 'k.renski@stratton-prime.pl' },
  { id: 'u33', hierarchicalId: 'GDJJ/KR/PL2', role: 'USER', firstName: 'Paulina', lastName: 'Leońska', email: 'p.leonska@stratton-prime.pl', password: 'TEMP', managerName: 'Kacper Reński', managerEmail: 'k.renski@stratton-prime.pl' },

  // GAŁĄŹ TOMASZ LASOWSKI (pod GDJJ)
  { id: 'u17', hierarchicalId: 'GDJJ/TL', role: 'MANAGER', firstName: 'Tomasz', lastName: 'Lasowski', email: 't.lasowski@stratton-prime.pl', password: 'TEMP', managerName: 'Jakub Jabłoński', managerEmail: 'j.jablonski@stratton-prime.pl' },
  { id: 'u16', hierarchicalId: 'GDJJ/TL/MT', role: 'MANAGER', firstName: 'Mateusz', lastName: 'Tyl', email: 'm.tyl@stratton-prime.pl', password: 'TEMP', managerName: 'Tomasz Lasowski', managerEmail: 't.lasowski@stratton-prime.pl' },

  // POZOSTALI (pod GDJJ)
  { id: 'u18', hierarchicalId: 'GDJJ/MJ', role: 'MANAGER', firstName: 'Maciej', lastName: 'Jabłoński', email: 'm.jablonski@stratton-prime.pl', password: 'TEMP', managerName: 'Jakub Jabłoński', managerEmail: 'j.jablonski@stratton-prime.pl' },
  { id: 'u45', hierarchicalId: 'GDJJ/PD', role: 'MANAGER', firstName: 'Piotr', lastName: 'Dymowski', email: 'p.dymowski@stratton-prime.pl', password: 'TEMP', managerName: 'Jakub Jabłoński', managerEmail: 'j.jablonski@stratton-prime.pl' },
  { id: 'u50', hierarchicalId: 'GDJJ/PD/PZ', role: 'MANAGER', firstName: 'Przemysław', lastName: 'Zych', email: 'p.zych@stratton-prime.pl', password: 'TEMP', managerName: 'Piotr Dymowski', managerEmail: 'p.dymowski@stratton-prime.pl' }
];

// Logika przetwarzania - nadpisuje hasła losowymi dla nie-adminów
export const DEFAULT_USERS: User[] = RAW_USERS.map(user => {
    // Konta chronione (Admini i testowe) zachowują swoje hasła
    // DODANO: test-pass-user
    if (user.role === 'ADMIN' || user.id === 'test-user-dev' || user.id === 'test-pass-user') {
        return user;
    }
    
    // Reszta otrzymuje losowe hasło przy inicjalizacji bazy
    return {
        ...user,
        password: generateRandomPass()
    };
});
