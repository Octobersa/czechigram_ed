// Keep the same bug definition structure
export type Bug = {
    id: string;
    description: string;
};

export const Bugs = {
    MISSING_EMAIL_VALIDATION: {
        id: "MISSING_EMAIL_VALIDATION",
        description: "Emailová validace chybí(validuje se jen to že tam je text), uživatelé mohou mít neplatné emaily."
    },
    NON_VALID_MAIL_USER_CANNOT_LOGIN: {
        id: "NON_VALID_MAIL_USER_CANNOT_LOGIN",
        description: "MISSING_EMAIL_VALIDATION bug způsobil, že existují uživatelé, kteří mají neplatné emaily a nemohou se přihlásit, protože login validuje mail."
    },
    REPORT_DESCRIPTION_NOT_OPTIONAL: {
        id: "REPORT_DESCRIPTION_NOT_OPTIONAL",
        description: "Popis nahlášení příspěvku by měl být nepovinný"
    },
    POST_DESCRIPTION_NOT_OPTIONAL: {
        id: "POST_DESCRIPTION_NOT_OPTIONAL",
        description: "Popis příspěvku by měl být nepovinný, ale je povinný"
    },
    UPLOAD_LIMIT_DOUBLED: {
        id: "UPLOAD_LIMIT_DOUBLED",
        description: "Limit pro upload souborů je 3 MB, ale kvůli bugu je limit zdvojnásoben na 6 MB."
    },
    UPLOAD_IS_TOO_SLOW: {
        id: "UPLOAD_IS_TOO_SLOW",
        description: "Po opravě bugu UPLOAD_LIMIT_DOUBLED (navazující bug) je upload uměle prodloužen o 5 sekund."
    },
    POST_CANNOT_BE_UNLIKED: {
        id: "POST_CANNOT_BE_UNLIKED",
        description: "Nelze zrušit like u příspěvku, i když to má být možné"
    },
    POST_SEARCH_NOT_WORKING: {
        id: "POST_SEARCH_NOT_WORKING",
        description: "Funkcionalita vyhledávání příspěvků podle popisu nefunguje"
    },
    SCROLL_LOAD_NOT_WORKING: {
        id: "SCROLL_LOAD_NOT_WORKING",
        description: "Načtě se pouze 10 příspěvků, i když by se měly načítat další při scrollování"
    },
    USER_ID_INSTEAD_OF_USERNAME: {
        id: "USER_ID_INSTEAD_OF_USERNAME",
        description: "User ID je zobrazováno místo uživatelského jména v příspěvcích"
    },
    TYPO_ON_LOGIN_PAGE: {
        id: "TYPO_ON_LOGIN_PAGE",
        description: "Na přihlašovací stránce je překlep ve slově Zaregistruj"
    },
    ICON_MISSING_IN_MAIN_MENU: {
        id: "ICON_MISSING_IN_MAIN_MENU",
        description: "V hlavním menu chybí ikona ↩️ u odhlašování"
    },
    PASSWORD_IS_VISIBLE: {
        id: "PASSWORD_IS_VISIBLE",
        description: "Heslo je viditelné při přihlášení, mělo by být skryté, bezpečnostní chyba"
    },
    POST_CANNOT_BE_ADDED_ON_PROFILE_PAGE: {
        id: "POST_CANNOT_BE_ADDED_ON_PROFILE_PAGE",
        description: "Chybí tlačítko pro přidání příspěvku na stránce profilu, i když by tam mělo být"
    },
    HTML_CODE_VISIBLE_ON_SEARCH_PAGE: {
        id: "HTML_CODE_VISIBLE_ON_SEARCH_PAGE",
        description: "Na stránce vyhledávání příspěvků je viditelný HTML kód (span tag s textem), který by tam neměl být"
    },
    DELETE_INSTEAD_OF_REPORT: {
        id: "DELETE_INSTEAD_OF_REPORT",
        description: "U cizíc příspěvků je tlačítko pro smazání příspěvku místo tlačítka pro nahlášení."
    }
} as const;

export type BugId = keyof typeof Bugs;

export function getAllBugs(): Bug[] {
    return Object.values(Bugs);
}