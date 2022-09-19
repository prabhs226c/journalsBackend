import getMysqlSession from "../Database/mysqlSession.js";

async function getJournals(req,res)
{
    const SQL = `SELECT ${process.env.JOURNALS_TABLE}.id,title,description,quote,author,date(journal_created) as journal_date, time(journal_created) as journal_time FROM ${process.env.DB_NAME}.${process.env.JOURNALS_TABLE} join ${process.env.DB_NAME}.${process.env.QUOTES_TABLE} on ${process.env.QUOTES_TABLE}.id = ${process.env.JOURNALS_TABLE}.quote_id order by ${process.env.JOURNALS_TABLE}.id desc`;

    const ROWS    = await executeMysqlQuery(SQL);
    const COLUMNS   = ROWS.getColumns();
    const JOURNALS = ROWS.fetchAll();

    const COLUMN_LABELS = [];
    COLUMNS.forEach(column=>{
        COLUMN_LABELS.push(column.getColumnLabel());
    })

    return res.status(200).json({hasErrors:false,data:JOURNALS,fields:COLUMN_LABELS})
}

async function getSingleJournal(req,res)
{
    const JOURNAL_ID = req.params.id;

    const ROWS = await getJournal(JOURNAL_ID);
    const COLUMNS   = ROWS.getColumns();
    const JOURNAL = ROWS.fetchOne();

    const COLUMN_LABELS = [];
    COLUMNS.forEach(column=>{
        COLUMN_LABELS.push(column.getColumnLabel());
    })

    let responseJSON;
    if(!JOURNAL) responseJSON = {hasErrors:true,errorType:"journalNotFound",errors:{msg:"Journal not found/invalid id"}};
    else responseJSON = {hasErrors:false,data:JOURNAL,fields:COLUMN_LABELS};

    return res.status(200).json(responseJSON);
}

async function deleteJournal(req,res)
{
    const USER_ID = req.user.id;

    const JOURNAL_ID = req.params.id;
    const JOURNAL_ROWS = await getJournal(JOURNAL_ID);
    const JOURNAL = JOURNAL_ROWS.fetchOne();
    if(!JOURNAL) return res.json({hasErrors:true,errorType:"journalNotFound",errors:{msg:"Journal not found"}});
    if(JOURNAL[1] !== USER_ID) return res.status(200).json({hasErrors:true,errorType:'notAllowed',errors:{msg:"You are not allowed to delete this journal"}});
    else{
        const SESSION = await getMysqlSession();
        const SCHEMA = await SESSION.getSchema(process.env.DB_NAME);
        const QUOTE_TABLE = SCHEMA.getTable(process.env.QUOTES_TABLE);
        const QUOTE_DELETED = await QUOTE_TABLE.delete().where('id = :v').bind('v',JOURNAL[2]).execute();

        if(QUOTE_DELETED.getAffectedItemsCount() === 0) return res.status(200).json({hasErrors:true,errorType:'unknown',errors:{msg:"Something went wrong. try again"}});
        else{
            const JOURNAL_TABLE = await SCHEMA.getTable(process.env.JOURNALS_TABLE);
            const JOURNAL_DELETED = await JOURNAL_TABLE.delete().where('id=:v').bind('v',JOURNAL_ID).execute();
            if(JOURNAL_DELETED.getAffectedItemsCount() === 0) return res.status(200).json({hasErrors:true,errorType:'unknown',errors:{msg:"Something went wrong. try again"}});
            else return res.status(200).json({hasErrors:false});
        }

    }
}

async function saveJournal(req,res)
{
    const USER_ID = req.user.id;
    const TITLE = req.body.title;
    const DESCRIPTION = req.body.description;
    const QUOTE = req.body.quote;
    const AUTHOR = req.body.author;

    const ERRORS = {};
    if(!TITLE) ERRORS.title = "Title is a required field";
    if(!DESCRIPTION) ERRORS.description = "Description is a required field";
    if(!QUOTE) ERRORS.quote = "Quote is a required field";
    if(!AUTHOR) ERRORS.author = "Author is a required field";

    if(Object.keys(ERRORS).length > 0) return res.status(200).json({hasErrors:true,errorType:'formError',errors:ERRORS})
    else{
        const SESSION = await getMysqlSession();
        const SCHEMA = await SESSION.getSchema(process.env.DB_NAME);
        const QUOTE_TABLE = SCHEMA.getTable(process.env.QUOTES_TABLE);
        const QUOTE_QUERY = await QUOTE_TABLE.insert('quote','author')
            .values([QUOTE,AUTHOR])
            .execute();
        const QUOTE_ID = QUOTE_QUERY.getAutoIncrementValue();

        const JOURNAL_TABLE = SCHEMA.getTable(process.env.JOURNALS_TABLE);
        const JOURNAL_QUERY = await JOURNAL_TABLE.insert('title','description','user_id','quote_id')
            .values([TITLE,DESCRIPTION,USER_ID,QUOTE_ID]).execute();
        const JOURNAL_ID = JOURNAL_QUERY.getAutoIncrementValue();
        await SESSION.close();

        const JOURNAL_ROWS = await getJournal(JOURNAL_ID);
        const COLUMNS   = JOURNAL_ROWS.getColumns();
        const JOURNAL = JOURNAL_ROWS.fetchOne();

        const COLUMN_LABELS = [];
        COLUMNS.forEach(column=>{
            COLUMN_LABELS.push(column.getColumnLabel());
        });

        return res.code(200).json({hasErrors:false,data:JOURNAL,fields:COLUMN_LABELS});
    }
}

async function updateJournal(req,res)
{
    const USER_ID = req.user.id;
    const JOURNAL_ID = req.body.id;
    const TITLE = req.body.title;
    const DESCRIPTION = req.body.description;

    const ERRORS = {};

    if(!TITLE) ERRORS.title = "Title is a required field";
    if(!DESCRIPTION) ERRORS.description = "Description is a required field";

    if(Object.keys(ERRORS).length > 0) return res.json({hasErrors:true,errorType:"formError",errors:ERRORS});

    const JOURNAL = await getJournal(JOURNAL_ID);
    if(!JOURNAL) return res.json({hasErrors:true,errorType:"journalNotFound",errors:{msg:"Journal not found"}});
    if(JOURNAL[1] !== USER_ID) return res.status(200).json({hasErrors:true,errorType:"notAllowed",errors:{msg:"You are not allowed to delete this journal"}});

    const SESSION = await getMysqlSession();
    const TABLE = await SESSION.getSchema(process.env.DB_NAME).getTable(process.env.JOURNALS_TABLE);
    const UPDATE = await TABLE.update()
        .set('title',TITLE).set('description',DESCRIPTION)
        .where('id = :v').bind('v',JOURNAL_ID)
        .execute();
    if(UPDATE.getAffectedItemsCount() > 0) return res.status(200).json({hasErrors:true,errorType:'unknown',errors:{msg:"Something went wrong. try again."}});
    const UPDATED_JOURNAL = await getJournal(JOURNAL_ID);
    const ROWS = UPDATED_JOURNAL.fetchOne();
    const COLUMNS = UPDATED_JOURNAL.getColumns();

    const COLUMN_LABELS = [];
    COLUMNS.forEach(column=>{
        COLUMN_LABELS.push(column.getColumnLabel());
    });

    return res.status(200).json({hasErrors:false,data:ROWS,fields:COLUMN_LABELS});
}

async function executeMysqlQuery(sql)
{
    const SESSION = await getMysqlSession();
    const QUERY   = await SESSION.sql(sql);
    const ROWS    = await QUERY.execute();
    await SESSION.close();
    return ROWS;
}

async function getJournal(journal_id)
{
    const SQL = `SELECT ${process.env.JOURNALS_TABLE}.id,user_id,quote_id,title,description,quote,author,date(journal_created) as journal_date, time(journal_created) as journal_time FROM ${process.env.DB_NAME}.${process.env.JOURNALS_TABLE} join ${process.env.DB_NAME}.${process.env.QUOTES_TABLE} on ${process.env.QUOTES_TABLE}.id = ${process.env.JOURNALS_TABLE}.quote_id where ${process.env.JOURNALS_TABLE}.id = ${journal_id} order by ${process.env.JOURNALS_TABLE}.id desc`;
    return await executeMysqlQuery(SQL);

}

export {getJournals,getSingleJournal,saveJournal,deleteJournal,updateJournal}