const { pool } = require('../config/database');

const logError = (functionName, error) => {
    console.error(`Error in ${functionName}:`, {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        position: error.position,
        internalPosition: error.internalPosition,
        internalQuery: error.internalQuery,
        where: error.where,
        schema: error.schema,
        table: error.table,
        column: error.column,
        dataType: error.dataType,
        constraint: error.constraint,
        stack: error.stack
    });
    return error;
};

const platformQueries = {
    // Keep the original implementation as a fallback
    // getAllPlatforms: async () => {
    //     try {
    //         console.log('Executing getAllPlatforms...');
            
    //         // Try with the function first
    //         try {
    //             const functionResult = await pool.query('SELECT * FROM get_all_platforms()');
    //             console.log('Function get_all_platforms executed successfully');
    //             return functionResult.rows;
    //         } catch (funcError) {
    //             // Log function error
    //             console.error('Function get_all_platforms failed:', funcError.message);
                
    //             // Fall back to direct SQL
    //             console.log('Falling back to direct SQL...');
    //             const directResult = await pool.query('SELECT * FROM PLATFORM ORDER BY platform_name');
    //             console.log('Direct SQL query executed successfully');
    //             return directResult.rows;
    //         }
    //     } catch (err) {
    //         throw logError('getAllPlatforms', err);
    //     }
    // },

    getAllPlatforms: async () => {
        try {
            const result = await pool.query('SELECT * FROM PLATFORM ORDER BY platform_name');
            return result.rows;
        } catch (err) {
            console.error('Error getting all platforms:', err);
            throw err;
        }
    },
    
    getPlatformById: async (platformId) => {
        try {
            console.log(`Executing getPlatformById with ID: ${platformId}...`);
            
            // Try with the function first
            try {
                const functionResult = await pool.query('SELECT * FROM get_platform_by_id($1)', [platformId]);
                console.log('Function get_platform_by_id executed successfully');
                return functionResult.rows.length > 0 ? functionResult.rows[0] : null;
            } catch (funcError) {
                // Log function error
                console.error('Function get_platform_by_id failed:', funcError.message);
                
                // Fall back to direct SQL
                console.log('Falling back to direct SQL...');
                const directResult = await pool.query('SELECT * FROM PLATFORM WHERE platform_id = $1', [platformId]);
                console.log('Direct SQL query executed successfully');
                return directResult.rows.length > 0 ? directResult.rows[0] : null;
            }
        } catch (err) {
            throw logError('getPlatformById', err);
        }
    },

    getPlatformByName: async (platformName) => {
        try {
            console.log(`Executing getPlatformByName with name: ${platformName}...`);
            
            // Try with the function first
            try {
                const functionResult = await pool.query('SELECT * FROM get_platform_by_name($1)', [platformName]);
                console.log('Function get_platform_by_name executed successfully');
                return functionResult.rows.length > 0 ? functionResult.rows[0] : null;
            } catch (funcError) {
                // Log function error
                console.error('Function get_platform_by_name failed:', funcError.message);
                
                // Fall back to direct SQL
                console.log('Falling back to direct SQL...');
                const directResult = await pool.query('SELECT * FROM PLATFORM WHERE platform_name = $1', [platformName]);
                console.log('Direct SQL query executed successfully');
                return directResult.rows.length > 0 ? directResult.rows[0] : null;
            }
        } catch (err) {
            throw logError('getPlatformByName', err);
        }
    },

    createPlatform: async (platformName) => {
        try {
            console.log(`Executing createPlatform with name: ${platformName}...`);
            
            // Try with the function first
            try {
                const functionResult = await pool.query(
                    'SELECT create_platform($1) as result',
                    [platformName]
                );
                console.log('Function create_platform executed successfully');
                return functionResult.rows[0].result;
            } catch (funcError) {
                // Log function error
                console.error('Function create_platform failed:', funcError.message);
                
                // Fall back to direct SQL
                console.log('Falling back to direct SQL...');
                
                // Check if platform exists
                const existingCheck = await pool.query(
                    'SELECT * FROM PLATFORM WHERE platform_name = $1',
                    [platformName]
                );
                
                if (existingCheck.rows.length > 0) {
                    console.log('Platform exists, returning existing platform');
                    return { 
                        exists: true,
                        platform: existingCheck.rows[0]
                    };
                }
                
                // Create new platform
                const insertResult = await pool.query(
                    'INSERT INTO PLATFORM (platform_name) VALUES ($1) RETURNING *',
                    [platformName]
                );
                
                console.log('Direct SQL query executed successfully');
                return { 
                    exists: false,
                    platform: insertResult.rows[0]
                };
            }
        } catch (err) {
            throw logError('createPlatform', err);
        }
    },

    updatePlatform: async (platformId, platformName) => {
        try {
            console.log(`Executing updatePlatform with ID: ${platformId}, name: ${platformName}...`);
            
            // Try with the function first
            try {
                const functionResult = await pool.query(
                    'SELECT * FROM update_platform($1, $2)',
                    [platformId, platformName]
                );
                console.log('Function update_platform executed successfully');
                return functionResult.rows.length > 0 ? functionResult.rows[0] : null;
            } catch (funcError) {
                // Log function error
                console.error('Function update_platform failed:', funcError.message);
                
                // Fall back to direct SQL
                console.log('Falling back to direct SQL...');
                const directResult = await pool.query(
                    'UPDATE PLATFORM SET platform_name = $1 WHERE platform_id = $2 RETURNING *',
                    [platformName, platformId]
                );
                console.log('Direct SQL query executed successfully');
                return directResult.rows.length > 0 ? directResult.rows[0] : null;
            }
        } catch (err) {
            throw logError('updatePlatform', err);
        }
    },

    // deletePlatform: async (platformId) => {
    //     try {
    //         console.log(`Executing deletePlatform with ID: ${platformId}...`);
            
    //         // Try with the function first
    //         try {
    //             const functionResult = await pool.query(
    //                 'SELECT * FROM delete_platform($1)',
    //                 [platformId]
    //             );
    //             console.log('Function delete_platform executed successfully');
    //             return functionResult.rows.length > 0 ? functionResult.rows[0] : null;
    //         } catch (funcError) {
    //             // Log function error
    //             console.error('Function delete_platform failed:', funcError.message);
                
    //             // Fall back to direct SQL
    //             console.log('Falling back to direct SQL...');
    //             const directResult = await pool.query(
    //                 'DELETE FROM PLATFORM WHERE platform_id = $1 RETURNING *',
    //                 [platformId]
    //             );
    //             console.log('Direct SQL query executed successfully');
    //             return directResult.rows.length > 0 ? directResult.rows[0] : null;
    //         }
    //     } catch (err) {
    //         throw logError('deletePlatform', err);
    //     }
    // }

    deletePlatform: async (platformId) => {
        try {
            console.log(`Executing deletePlatform with ID: ${platformId}...`);
    
            try {
                // Try with the stored procedure
                await pool.query(
                    'CALL delete_platform($1)',
                    [platformId]
                );
                console.log('Procedure delete_platform executed successfully');
                return { platform_id: platformId }; // You can customize this as needed
            } catch (procError) {
                console.error('Procedure delete_platform failed:', procError.message);
    
                // Fallback to direct SQL with return
                console.log('Falling back to direct SQL...');
                const directResult = await pool.query(
                    'DELETE FROM PLATFORM WHERE platform_id = $1 RETURNING *',
                    [platformId]
                );
                console.log('Direct SQL query executed successfully');
                return directResult.rows.length > 0 ? directResult.rows[0] : null;
            }
        } catch (err) {
            throw logError('deletePlatform', err);
        }
    }    
};

module.exports = platformQueries;